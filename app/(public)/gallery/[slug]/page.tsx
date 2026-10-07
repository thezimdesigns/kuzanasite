import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";
import { formatDate } from "@/lib/time";
import { PhotoGrid } from "@/components/public/photo-grid";
import { ShareButtons } from "@/components/public/share-buttons";
import { EmptyState, PageHeader, Section } from "@/components/ui";

const PAGE_SIZE = 60;

async function getAlbum(slug: string) {
  return db.photoAlbum.findFirst({
    where: { slug, publishStatus: { in: ["PUBLISHED", "ARCHIVED"] } },
    include: { event: { select: { title: true, slug: true } }, _count: { select: { photos: true } } },
  });
}

export async function generateMetadata({ params }: PageProps<"/gallery/[slug]">): Promise<Metadata> {
  const album = await getAlbum((await params).slug);
  if (!album) return {};
  const cover = fileUrl(album.coverKey);
  return { title: album.title, description: album.description ?? undefined, openGraph: cover ? { images: [cover] } : undefined };
}

export default async function AlbumPage({ params, searchParams }: PageProps<"/gallery/[slug]">) {
  const { slug } = await params;
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const album = await getAlbum(slug);
  if (!album) notFound();
  const photos = await db.photo.findMany({
    where: { albumId: album.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: PAGE_SIZE * page,
  });
  const hasMore = album._count.photos > photos.length;

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/gallery" className="underline">
            Gallery
          </Link>
        }
        title={album.title}
        intro={[album.date && formatDate(album.date), `${album._count.photos} photos`, album.photographer && `Photos: ${album.photographer}`]
          .filter(Boolean)
          .join(" · ")}
      >
        {album.description && <p className="mb-4 max-w-2xl">{album.description}</p>}
        {album.event && (
          <p className="mb-4 text-sm">
            From{" "}
            <Link href={`/events/${album.event.slug}`} className="font-semibold text-green-800 underline">
              {album.event.title}
            </Link>
          </p>
        )}
        <ShareButtons title={`KUZANA SCEEZ photos: ${album.title}`} path={`/gallery/${album.slug}`} />
      </PageHeader>
      <Section>
        {photos.length ? (
          <>
            <PhotoGrid photos={photos.map((p) => ({ id: p.id, src: fileUrl(p.key)!, caption: p.caption, width: p.width, height: p.height }))} />
            {hasMore && (
              <div className="mt-8 text-center">
                <Link href={`/gallery/${album.slug}?page=${page + 1}`} scroll={false} className="rounded-full border-2 border-green-900 px-5 py-2.5 font-heading font-bold text-green-900">
                  Load more photos
                </Link>
              </div>
            )}
          </>
        ) : (
          <EmptyState>Photos are being added to this album.</EmptyState>
        )}
      </Section>
    </>
  );
}
