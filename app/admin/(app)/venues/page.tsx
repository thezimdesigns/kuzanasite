import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { can, requireStaff } from "@/lib/permissions";
import { AdminPage, RowLink, Table } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui";

export const metadata = { title: "Venues" };

export default async function AdminVenues() {
  const user = await requireStaff();
  const venues = await db.venue.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { events: true } } },
  });
  return (
    <AdminPage
      title="Venues"
      actions={
        can(user, "programme") && (
          <ButtonLink href="/admin/venues/new" size="sm">
            <Plus className="size-4" /> New venue
          </ButtonLink>
        )
      }
    >
      <Table>
        <thead>
          <tr>
            <th>Venue</th>
            <th>Address</th>
            <th>Events</th>
          </tr>
        </thead>
        <tbody>
          {venues.map((v) => (
            <tr key={v.id}>
              <td>
                <RowLink href={`/admin/venues/${v.id}`}>{v.name}</RowLink>
              </td>
              <td>{v.address ?? "-"}</td>
              <td>{v._count.events}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </AdminPage>
  );
}
