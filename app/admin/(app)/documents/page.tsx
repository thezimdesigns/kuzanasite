import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { formatBytes } from "@/lib/files";
import { DOCUMENT_TYPE_LABELS } from "@/lib/options";
import { can, requireStaff } from "@/lib/permissions";
import { formatDate } from "@/lib/time";
import { AdminPage, PublishBadge, RowLink, Table } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui";

export const metadata = { title: "Documents & press" };

export default async function AdminDocuments() {
  const user = await requireStaff();
  const docs = await db.document.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }], include: { event: { select: { title: true } } } });
  return (
    <AdminPage
      title="Documents & press"
      description="Press releases, speeches, presentations, press kits and reports for the media centre."
      actions={
        can(user, "press") && (
          <ButtonLink href="/admin/documents/new" size="sm">
            <Plus className="size-4" /> New document
          </ButtonLink>
        )
      }
    >
      <Table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Date</th>
            <th>File</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id}>
              <td>
                <RowLink href={`/admin/documents/${d.id}`}>{d.title}</RowLink>
                {d.event && <div className="text-xs text-muted">{d.event.title}</div>}
              </td>
              <td>{DOCUMENT_TYPE_LABELS[d.type]}</td>
              <td className="whitespace-nowrap">{d.date ? formatDate(d.date) : "-"}</td>
              <td>{d.key ? formatBytes(d.size) : "text only"}</td>
              <td>
                <PublishBadge status={d.publishStatus} />
              </td>
            </tr>
          ))}
          {docs.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-muted">
                No documents yet.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </AdminPage>
  );
}
