import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { deleteSeries } from "@/app/admin/actions/content";
import { ActionButton } from "@/components/admin/admin-form";
import { SeriesForm } from "@/components/admin/series-form";
import { AdminPage, Panel, PublishBadge, ReadOnlyNotice } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui";
import { db } from "@/lib/db";
import { can, requireStaff } from "@/lib/permissions";

export const metadata = { title: "Series" };

export default async function AdminSeries({ searchParams }: PageProps<"/admin/series">) {
  const user = await requireStaff();
  const editable = can(user, "press");
  const edit = (await searchParams).edit;
  const series = await db.series.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { posts: true } } },
  });
  const current = typeof edit === "string" ? series.find((s) => s.id === edit) : undefined;
  const creating = edit === "new";

  return (
    <AdminPage
      title="Series"
      back={{ href: "/admin/news", label: "News" }}
      description="Editorial series told in numbered parts, such as Signal. Write each part in News and choose the series and part number."
      actions={
        editable && (
          <ButtonLink href="/admin/series?edit=new" size="sm">
            <Plus className="size-4" /> New series
          </ButtonLink>
        )
      }
    >
      {!editable && <ReadOnlyNotice />}
      {(current || creating) && (
        <Panel title={current ? `Edit ${current.title}` : "New series"} className="mb-6">
          <SeriesForm
            key={current?.id ?? "new"}
            readOnly={!editable}
            values={{
              id: current?.id,
              title: current?.title ?? "",
              slug: current?.slug ?? "",
              tagline: current?.tagline ?? "",
              description: current?.description ?? "",
              author: current?.author ?? "",
              coverKey: current?.coverKey ?? "",
              sortOrder: current?.sortOrder ?? 0,
              publishStatus: current?.publishStatus ?? "PUBLISHED",
            }}
          />
        </Panel>
      )}
      <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
        {series.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <Link href={`/admin/series?edit=${s.id}`} className="font-heading font-bold text-green-900 hover:underline">
                {s.title}
              </Link>
              <p className="text-sm text-muted">
                {s.author ? `by ${s.author} · ` : ""}
                {s._count.posts} part{s._count.posts === 1 ? "" : "s"}
              </p>
            </div>
            <PublishBadge status={s.publishStatus} />
            {editable && (
              <ButtonLink href={`/admin/news/new?kind=STORY&series=${s.id}`} size="sm" variant="outline">
                <Plus className="size-4" /> Next part
              </ButtonLink>
            )}
            <Link href={`/series/${s.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-green-800 hover:underline">
              View <ExternalLink className="size-3.5" />
            </Link>
            {editable && (
              <ActionButton action={deleteSeries.bind(null, s.id)} confirm={`Delete the series "${s.title}"? Its parts stay as stand-alone stories.`} variant="ghost">
                Delete
              </ActionButton>
            )}
          </li>
        ))}
        {series.length === 0 && <li className="px-4 py-8 text-center text-muted">No series yet. Create one for Signal.</li>}
      </ul>
    </AdminPage>
  );
}
