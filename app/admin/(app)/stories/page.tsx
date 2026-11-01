import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { setSubmissionStatus, startStoryDraft } from "@/app/admin/actions/content";
import { ActionButton } from "@/components/admin/admin-form";
import { StoryInvite } from "@/components/admin/story-invite";
import { AdminPage, Panel, ReadOnlyNotice, Tabs } from "@/components/admin/ui";
import { Badge } from "@/components/ui";
import { db } from "@/lib/db";
import { getSiteState } from "@/lib/edition";
import { fileUrl } from "@/lib/files";
import { can, requireStaff } from "@/lib/permissions";
import { siteUrl } from "@/lib/site";
import { formatDay, formatTime } from "@/lib/time";

export const metadata = { title: "Stories" };

const STATUS_LABEL: Record<string, string> = { NEW: "New", DRAFTED: "Story drafted", ARCHIVED: "Archived" };

export default async function AdminStories({ searchParams }: PageProps<"/admin/stories">) {
  const user = await requireStaff();
  const editable = can(user, "press");
  const tab = (await searchParams).tab === "invite" ? "invite" : "inbox";
  const { past } = await getSiteState();
  const [submissions, newCount] = await Promise.all([
    db.storySubmission.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { exhibitor: { select: { name: true, slug: true } }, person: { select: { name: true, slug: true } } },
    }),
    db.storySubmission.count({ where: { status: "NEW" } }),
  ]);

  return (
    <AdminPage
      title="Stories"
      description="Follow up with participants. Invite them to share what came out of KUZANA, then turn the best answers into stories."
      actions={
        <Link href="/stories/share" target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-green-800 underline">
          Open the public form <ExternalLink className="size-3.5" />
        </Link>
      }
    >
      {!editable && <ReadOnlyNotice />}
      <Tabs
        current={tab}
        tabs={[
          { href: "/admin/stories", label: "Submissions", value: "inbox", count: newCount },
          { href: "/admin/stories?tab=invite", label: `Invite ${past ? `${past.year} ` : ""}participants`, value: "invite" },
        ]}
      />
      {tab === "inbox" ? (
        <div className="space-y-4">
          {submissions.length === 0 && (
            <Panel>
              <p className="text-sm text-muted">No stories yet. Use the Invite tab to send participants their personal link.</p>
            </Panel>
          )}
          {submissions.map((s) => (
            <Panel
              key={s.id}
              title={
                <span className="flex flex-wrap items-center gap-2">
                  {s.organisation ? `${s.organisation} · ${s.name}` : s.name}
                  <Badge tone={s.status === "NEW" ? "orange" : s.status === "DRAFTED" ? "green" : "neutral"}>{STATUS_LABEL[s.status] ?? s.status}</Badge>
                  {s.returning?.startsWith("Yes") && <Badge tone="gold">Back next year</Badge>}
                </span>
              }
            >
              <p className="-mt-2 mb-4 text-sm text-muted">
                {s.role} · {formatDay(s.createdAt)}, {formatTime(s.createdAt)}
                {s.email && <> · {s.email}</>}
                {s.phone && <> · {s.phone}</>}
                {s.exhibitor && (
                  <>
                    {" "}
                    ·{" "}
                    <Link href={`/exhibitors/${s.exhibitor.slug}`} target="_blank" className="font-semibold text-green-800 underline">
                      {s.exhibitor.name}
                    </Link>
                  </>
                )}
                {s.person && (
                  <>
                    {" "}
                    ·{" "}
                    <Link href={`/speakers/${s.person.slug}`} target="_blank" className="font-semibold text-green-800 underline">
                      {s.person.name}
                    </Link>
                  </>
                )}
              </p>
              <div className="grid gap-4 md:grid-cols-[1fr_10rem]">
                <dl className="space-y-3 text-sm">
                  {(
                    [
                      ["How they took part", s.tookPart],
                      ["What came out of it", s.outcomes],
                      ["Working on now", s.workingOn],
                      ["Will they be back?", s.returning],
                    ] as const
                  )
                    .filter(([, v]) => v)
                    .map(([q, a]) => (
                      <div key={q}>
                        <dt className="font-semibold text-ink">{q}</dt>
                        <dd className="whitespace-pre-line text-ink/85">{a}</dd>
                      </div>
                    ))}
                </dl>
                {s.photoKey && (
                  <a href={fileUrl(s.photoKey)!} target="_blank" rel="noopener" className="block overflow-hidden rounded-[var(--radius-control)] border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fileUrl(s.photoKey)!} alt={`Photo from ${s.name}`} className="aspect-square w-full object-cover" loading="lazy" />
                  </a>
                )}
              </div>
              {editable && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  {s.postId ? (
                    <Link href={`/admin/news/${s.postId}`} className="text-sm font-semibold text-green-800 underline">
                      Open the story draft
                    </Link>
                  ) : (
                    <ActionButton action={startStoryDraft.bind(null, s.id)} variant="primary">
                      Start a story draft
                    </ActionButton>
                  )}
                  {s.status !== "ARCHIVED" ? (
                    <ActionButton action={setSubmissionStatus.bind(null, s.id, "ARCHIVED")} variant="ghost">
                      Archive
                    </ActionButton>
                  ) : (
                    <ActionButton action={setSubmissionStatus.bind(null, s.id, "NEW")} variant="ghost">
                      Move back to new
                    </ActionButton>
                  )}
                </div>
              )}
            </Panel>
          ))}
        </div>
      ) : (
        <InviteList pastId={past?.id ?? null} year={past?.year ?? null} submitted={submissions} />
      )}
    </AdminPage>
  );
}

/** Everyone who took part in the last edition, each with a personal "Share your story" message. */
async function InviteList({ pastId, year, submitted }: { pastId: string | null; year: number | null; submitted: { exhibitorId: string | null; personId: string | null }[] }) {
  const [exhibitors, people] = await Promise.all([
    db.exhibitor.findMany({
      where: { status: "APPROVED", ...(pastId && { editionId: pastId }) },
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true, contactName: true, phone: true, whatsapp: true, email: true },
    }),
    db.person.findMany({
      where: { publishStatus: "PUBLISHED", OR: [{ eventRoles: { some: {} } }, { sessionRoles: { some: {} } }] },
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true, organisation: true },
    }),
  ]);
  const done = { exhibitors: new Set(submitted.map((s) => s.exhibitorId)), people: new Set(submitted.map((s) => s.personId)) };
  const edition = year ? `KUZANA SCEEZ ${year}` : "KUZANA SCEEZ";
  const message = (greeting: string, what: string, slug: string) =>
    `Hello ${greeting}, thank you for being part of ${edition}${what ? ` with ${what}` : ""}. We are following up with participants to share their stories: what came out of the expo and what you are working on now. It takes about 5 minutes: ${siteUrl(`/stories/share?for=${slug}`)}\n\nWe may feature you on kuzana.org.zw. Thank you, the KUZANA team`;
  const subject = `Your ${edition} story`;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Each link is personal: it fills in who the story is about, so answers arrive linked to the right profile. Speakers have no contact details on file; copy the message and send it from your
        own contacts.
      </p>
      <Panel title={`Exhibitors (${exhibitors.length})`}>
        <ul className="divide-y divide-line">
          {exhibitors.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">
                  {x.name} {done.exhibitors.has(x.id) && <Badge tone="green">Replied</Badge>}
                </p>
                <p className="text-sm text-muted">{x.contactName}</p>
              </div>
              <StoryInvite message={message(x.contactName.split(" ")[0] || x.contactName, x.name, x.slug)} phone={x.whatsapp ?? x.phone} email={x.email} subject={subject} />
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title={`Speakers and guests (${people.length})`}>
        <ul className="divide-y divide-line">
          {people.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">
                  {p.name} {done.people.has(p.id) && <Badge tone="green">Replied</Badge>}
                </p>
                {p.organisation && <p className="text-sm text-muted">{p.organisation}</p>}
              </div>
              <StoryInvite message={message(p.name, "", p.slug)} phone={null} email={null} subject={subject} />
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
