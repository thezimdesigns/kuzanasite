import { db } from "@/lib/db";
import { requireStaff } from "@/lib/permissions";
import { formatDate } from "@/lib/time";
import { AdminPage, RowLink, Table } from "@/components/admin/ui";

export const metadata = { title: "Pages" };

export default async function AdminPages() {
  await requireStaff();
  const pages = await db.page.findMany({ orderBy: { title: "asc" } });
  return (
    <AdminPage title="Content pages" description="Plan Your Visit, privacy notice and other editable pages.">
      <Table>
        <thead>
          <tr>
            <th>Page</th>
            <th>Address</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p) => (
            <tr key={p.id}>
              <td>
                <RowLink href={`/admin/pages/${p.id}`}>{p.title}</RowLink>
              </td>
              <td className="text-xs text-muted">/{p.slug}</td>
              <td className="text-xs">{formatDate(p.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </AdminPage>
  );
}
