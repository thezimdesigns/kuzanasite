import type { Metadata } from "next";
import { db } from "@/lib/db";
import { AlbumCard } from "@/components/public/cards";
import { EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Photo gallery",
  description: "Photos from KUZANA SCEEZ: exhibitions, conferences, sport, music and behind the scenes.",
};

export default async function GalleryPage() {
  const albums = await db.photoAlbum.findMany({
    where: { publishStatus: "PUBLISHED" },
    orderBy: [{ date: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { photos: true } },
      photos: { take: 1, orderBy: { sortOrder: "asc" } },
    },
  });
  return (
    <>
      <PageHeader title="Photo gallery" intro="Albums from across the KUZANA week." />
      <Section>
        {albums.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {albums.map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </div>
        ) : (
          <EmptyState>Photo albums will appear here during the event.</EmptyState>
        )}
      </Section>
    </>
  );
}
