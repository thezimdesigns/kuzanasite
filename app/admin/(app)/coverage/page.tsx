import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { PLATFORM_LABELS } from "@/lib/coverage";
import { can, requireStaff } from "@/lib/permissions";
import { formatDate, toDateInput } from "@/lib/time";
import { deleteMention } from "@/app/admin/actions/content";
import { ActionButton } from "@/components/admin/admin-form";
import { MentionForm } from "@/components/admin/mention-form";
import { AdminPage, Panel, PublishBadge, ReadOnlyNotice } from "@/components/admin/ui";
import { Badge } from "@/components/ui";

export const metadata = { title: "In the media" };

export default async function AdminCoverage() {
  const user = await requireStaff();
  const editable = can(user, "press");
  const mentions = await db.mediaMention.findMany({
    orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  });
  return (
    <AdminPage
      title="In the media"
      description="Links to articles, posts and broadcasts about KUZANA. Shown on the homepage, the media centre and /media/coverage."
    >
      {!editable && <ReadOnlyNotice />}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {editable && (
          <Panel title="Add a link">
            <MentionForm
              values={{
                url: "",
                title: "",
                outlet: "",
                platform: "",
                excerpt: "",
                publishedAt: "",
                featured: false,
                publishStatus: "PUBLISHED",
              }}
            />
          </Panel>
        )}
        <ul className="space-y-3">
          {mentions.map((m) => (
            <li key={m.id}>
              <Panel>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge tone="green">{PLATFORM_LABELS[m.platform]}</Badge>
                  <PublishBadge status={m.publishStatus} />
                  {m.featured && <Badge tone="orange">first</Badge>}
                  <span className="text-muted">
                    {m.outlet}
                    {m.publishedAt && `, ${formatDate(m.publishedAt)}`}
                  </span>
                </div>
                <a href={m.url} target="_blank" rel="noopener" className="mt-1.5 inline-flex items-start gap-1 font-semibold hover:underline">
                  {m.title} <ExternalLink className="mt-1 size-3.5 shrink-0" />
                </a>
                {editable && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-semibold text-green-800">Edit</summary>
                    <div className="mt-3">
                      <MentionForm
                        values={{
                          id: m.id,
                          url: m.url,
                          title: m.title,
                          outlet: m.outlet ?? "",
                          platform: m.platform,
                          excerpt: m.excerpt ?? "",
                          publishedAt: toDateInput(m.publishedAt),
                          featured: m.featured,
                          publishStatus: m.publishStatus,
                        }}
                      />
                      <div className="mt-2">
                        <ActionButton action={deleteMention.bind(null, m.id)} variant="ghost" confirm="Remove this link?">
                          Remove
                        </ActionButton>
                      </div>
                    </div>
                  </details>
                )}
              </Panel>
            </li>
          ))}
          {mentions.length === 0 && <p className="text-sm text-muted">No coverage added yet.</p>}
        </ul>
      </div>
    </AdminPage>
  );
}
