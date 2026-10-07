import { db } from "@/lib/db";
import { can, requireStaff } from "@/lib/permissions";
import { formatDate } from "@/lib/time";
import { setCurrentEdition } from "@/app/admin/actions/site";
import { ActionButton } from "@/components/admin/admin-form";
import { EditionForm } from "@/components/admin/edition-form";
import { AdminPage, Panel, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui";

export const metadata = { title: "Editions" };

export default async function AdminEditions() {
  const user = await requireStaff();
  const editable = can(user, "site");
  const editions = await db.edition.findMany({
    orderBy: { year: "desc" },
    include: { _count: { select: { events: true, exhibitors: true, albums: true } } },
  });
  return (
    <AdminPage
      title="Editions"
      description="Each KUZANA year is an edition. New events, exhibitors and media go into the current edition; earlier ones stay in the archive."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {editable && (
          <Panel title="New edition">
            <EditionForm />
          </Panel>
        )}
        <Table className="h-fit">
          <thead>
            <tr>
              <th>Edition</th>
              <th>Dates</th>
              <th>Content</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {editions.map((e) => (
              <tr key={e.id}>
                <td className="font-semibold">
                  {e.name} {e.isCurrent && <Badge tone="green">current</Badge>}
                </td>
                <td className="text-xs whitespace-nowrap">
                  {formatDate(e.startDate)} – {formatDate(e.endDate)}
                </td>
                <td className="text-xs">
                  {e._count.events} events · {e._count.exhibitors} exhibitors · {e._count.albums} albums
                </td>
                <td>
                  {editable && !e.isCurrent && (
                    <ActionButton action={setCurrentEdition.bind(null, e.id)} confirm={`Switch the live site to ${e.name}?`}>
                      Make current
                    </ActionButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </AdminPage>
  );
}
