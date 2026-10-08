import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";
import { can, requireStaff } from "@/lib/permissions";
import { formatDate } from "@/lib/time";
import { AdminPage, PublishBadge, RowLink, Table } from "@/components/admin/ui";
import { Badge, ButtonLink } from "@/components/ui";

export const metadata = { title: "News" };

export default async function AdminNews() {
  const user = await requireStaff();
  const posts = await db.newsPost.findMany({ orderBy: { publishedAt: "desc" } });
  return (
    <AdminPage
      title="News"
      description="Stories for the homepage and the news pages."
      actions={
        can(user, "press") && (
          <ButtonLink href="/admin/news/new" size="sm">
            <Plus className="size-4" /> New story
          </ButtonLink>
        )
      }
    >
      <Table>
        <thead>
          <tr>
            <th />
            <th>Headline</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id}>
              <td className="w-20">
                {p.coverKey && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileUrl(p.coverKey)!} alt="" className="h-10 w-16 rounded object-cover" loading="lazy" />
                )}
              </td>
              <td>
                <RowLink href={`/admin/news/${p.id}`}>{p.title}</RowLink> {p.featured && <Badge tone="orange">lead</Badge>}
              </td>
              <td className="whitespace-nowrap">{formatDate(p.publishedAt)}</td>
              <td>
                <PublishBadge status={p.publishStatus} />
              </td>
            </tr>
          ))}
          {posts.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-muted">
                No stories yet.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </AdminPage>
  );
}
