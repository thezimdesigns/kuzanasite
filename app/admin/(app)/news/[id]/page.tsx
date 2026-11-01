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
import { fileUrl } from "@/lib/files";
import { IMAGE_CODE } from "@/components/markdown";

export default async function EditNews({ params }: PageProps<"/admin/news/[id]">) {
  const user = await requireStaff();
  const editable = can(user, "press");
  const [p, options] = await Promise.all([
    db.newsPost.findUnique({
      where: { id: (await params).id },
      include: { exhibitors: { select: { exhibitorId: true } }, people: { select: { personId: true } }, images: { orderBy: { number: "asc" } } },
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
          coverCaption: p.coverCaption ?? "",
          coverCredit: p.coverCredit ?? "",
          coverCreditUrl: p.coverCreditUrl ?? "",
          images: p.images.map((i) => ({
            number: i.number,
            key: i.key,
            url: fileUrl(i.key) ?? "",
            alt: i.alt ?? "",
            caption: i.caption ?? "",
            credit: i.credit ?? "",
            creditUrl: i.creditUrl ?? "",
            width: i.width,
            height: i.height,
          })),
          // Past every number in use or still written in the text, so a code never changes picture.
          nextImageNumber: Math.max(0, ...p.images.map((i) => i.number), ...[...p.body.matchAll(IMAGE_CODE)].map((m) => Number(m[1]))) + 1,
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
