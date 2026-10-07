import { db } from "@/lib/db";
import { can, requireStaff } from "@/lib/permissions";
import { formatDate } from "@/lib/time";
import { AlbumForm } from "@/components/admin/album-form";
import { AdminPage, Panel, PublishBadge, RowLink, Table } from "@/components/admin/ui";

export const metadata = { title: "Galleries" };

export default async function AdminGalleries() {
  const user = await requireStaff();
  const [albums, events] = await Promise.all([
    db.photoAlbum.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }], include: { _count: { select: { photos: true } } } }),
    db.event.findMany({ orderBy: { startsAt: "asc" }, select: { id: true, title: true } }),
  ]);
  return (
    <AdminPage title="Photo galleries" description="Create an album, then upload photos straight from a phone or laptop.">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {can(user, "media") && (
          <Panel title="New album">
            <AlbumForm events={events} values={{ title: "", slug: "", description: "", date: "", eventId: "", photographer: "", sortOrder: 0, publishStatus: "PUBLISHED" }} />
          </Panel>
        )}
        <Table className="h-fit">
          <thead>
            <tr>
              <th>Album</th>
              <th>Photos</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {albums.map((a) => (
              <tr key={a.id}>
                <td>
                  <RowLink href={`/admin/galleries/${a.id}`}>{a.title}</RowLink>
                </td>
                <td>{a._count.photos}</td>
                <td className="whitespace-nowrap">{a.date ? formatDate(a.date) : "-"}</td>
                <td>
                  <PublishBadge status={a.publishStatus} />
                </td>
              </tr>
            ))}
            {albums.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted">
                  No albums yet.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </AdminPage>
  );
}
