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
  const posts = await db.newsPost.findMany({
    orderBy: { publishedAt: "desc" },
    include: { series: { select: { title: true } } },
  });
  return (
    <AdminPage
      title="News"
      description="News updates, participant stories, interviews and series parts. Stories and series also appear on the Stories page."
      actions={
        can(user, "press") && (
          <>
            <ButtonLink href="/admin/series" size="sm" variant="outline">
              Series
            </ButtonLink>
            <ButtonLink href="/admin/news/new?kind=STORY" size="sm" variant="outline">
              <Plus className="size-4" /> New participant story
            </ButtonLink>
            <ButtonLink href="/admin/news/new" size="sm">
              <Plus className="size-4" /> New update
            </ButtonLink>
          </>
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
                <RowLink href={`/admin/news/${p.id}`}>{p.title}</RowLink> {p.featured && <Badge tone="orange">lead</Badge>}{" "}
                {p.series ? (
                  <Badge tone="green">
                    {p.series.title}
                    {p.seriesPart ? ` · Part ${p.seriesPart}` : ""}
                  </Badge>
                ) : (
                  p.kind !== "UPDATE" && <Badge tone="gold">{p.kind === "STORY" ? "story" : "interview"}</Badge>
                )}
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
