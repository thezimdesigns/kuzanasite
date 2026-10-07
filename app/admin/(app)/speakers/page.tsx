import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { can, requireStaff } from "@/lib/permissions";
import { AdminPage, PublishBadge, RowLink, Table } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui";

export const metadata = { title: "Speakers" };

export default async function AdminSpeakers() {
  const user = await requireStaff();
  const people = await db.person.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { eventRoles: true, sessionRoles: true } } },
  });
  return (
    <AdminPage
      title="Speakers & participants"
      actions={
        can(user, "programme") && (
          <ButtonLink href="/admin/speakers/new" size="sm">
            <Plus className="size-4" /> New person
          </ButtonLink>
        )
      }
    >
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Organisation</th>
            <th>Appearances</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id}>
              <td>
                <RowLink href={`/admin/speakers/${p.id}`}>{p.name}</RowLink>
                <div className="text-xs text-muted">{p.jobTitle}</div>
              </td>
              <td>{p.organisation ?? "-"}</td>
              <td>{p._count.eventRoles + p._count.sessionRoles}</td>
              <td>
                <PublishBadge status={p.publishStatus} />
              </td>
            </tr>
          ))}
          {people.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-muted">
                No speakers yet. Add them here or straight from an event or session.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </AdminPage>
  );
}
