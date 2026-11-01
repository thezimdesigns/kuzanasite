import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { can, requireStaff } from "@/lib/permissions";
import { toLocalInput } from "@/lib/time";
import { deleteNews } from "@/app/admin/actions/content";
import { ActionButton } from "@/components/admin/admin-form";
import { NewsForm } from "@/components/admin/news-form";
import { AdminPage, ReadOnlyNotice } from "@/components/admin/ui";
import { newsOptions } from "@/lib/news-admin";

export default async function EditNews({ params }: PageProps<"/admin/news/[id]">) {
  const user = await requireStaff();
  const editable = can(user, "press");
  const [p, options] = await Promise.all([
    db.newsPost.findUnique({
      where: { id: (await params).id },
      include: { exhibitors: { select: { exhibitorId: true } }, people: { select: { personId: true } } },
    }),
    newsOptions(),
  ]);
  if (!p) notFound();
  return (
    <AdminPage
      title={p.title}
      back={{ href: "/admin/news", label: "News" }}
      actions={
        <Link href={`/news/${p.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-green-800 underline">
          View story <ExternalLink className="size-3.5" />
        </Link>
      }
    >
      {!editable && <ReadOnlyNotice />}
      <NewsForm
        readOnly={!editable}
        options={options}
        values={{
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt ?? "",
          body: p.body,
          coverKey: p.coverKey ?? "",
          coverAlt: p.coverAlt ?? "",
          author: p.author ?? "",
          eventId: p.eventId ?? "",
          featured: p.featured,
          publishStatus: p.publishStatus,
          publishedAt: toLocalInput(p.publishedAt),
          kind: p.kind,
          seriesId: p.seriesId ?? "",
          seriesPart: p.seriesPart ? String(p.seriesPart) : "",
          exhibitorIds: p.exhibitors.map((x) => x.exhibitorId),
          personIds: p.people.map((x) => x.personId),
        }}
      />
      {editable && (
        <div className="mt-8">
          <ActionButton action={deleteNews.bind(null, p.id)} variant="danger" confirm="Delete this story permanently?">
            Delete story
          </ActionButton>
        </div>
      )}
    </AdminPage>
  );
}
