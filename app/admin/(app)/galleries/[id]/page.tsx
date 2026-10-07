import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { can, requireStaff } from "@/lib/permissions";
import { toDateInput } from "@/lib/time";
import { deleteAlbum } from "@/app/admin/actions/media";
import { ActionButton } from "@/components/admin/admin-form";
import { AlbumForm } from "@/components/admin/album-form";
import { PhotoTile, PhotoUploader } from "@/components/admin/photo-manager";
import { AdminPage, Panel, ReadOnlyNotice } from "@/components/admin/ui";

export default async function AdminAlbum({ params }: PageProps<"/admin/galleries/[id]">) {
  const user = await requireStaff();
  const editable = can(user, "media");
  const { id } = await params;
  const [album, events] = await Promise.all([
    db.photoAlbum.findUnique({ where: { id }, include: { photos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } } }),
    db.event.findMany({ orderBy: { startsAt: "asc" }, select: { id: true, title: true } }),
  ]);
  if (!album) notFound();
  return (
    <AdminPage
      title={album.title}
      back={{ href: "/admin/galleries", label: "Galleries" }}
      actions={
        <Link href={`/gallery/${album.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-green-800 underline">
          View album <ExternalLink className="size-3.5" />
        </Link>
      }
    >
      {!editable && <ReadOnlyNotice />}
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <Panel title="Album details">
            <AlbumForm
              readOnly={!editable}
              events={events}
              values={{
                id: album.id,
                title: album.title,
                slug: album.slug,
                description: album.description ?? "",
                date: toDateInput(album.date),
                eventId: album.eventId ?? "",
                photographer: album.photographer ?? "",
                sortOrder: album.sortOrder,
                publishStatus: album.publishStatus,
              }}
            />
          </Panel>
          {editable && (
            <ActionButton action={deleteAlbum.bind(null, album.id)} variant="danger" confirm={`Delete "${album.title}" and all ${album.photos.length} photos?`}>
              Delete album
            </ActionButton>
          )}
        </div>
        <Panel title={`Photos (${album.photos.length})`}>
          {editable && (
            <div className="mb-5">
              <PhotoUploader albumId={album.id} />
            </div>
          )}
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {album.photos.map((p) => (
              <PhotoTile key={p.id} photo={p} albumId={album.id} isCover={album.coverKey === p.key} />
            ))}
          </ul>
        </Panel>
      </div>
    </AdminPage>
  );
}
