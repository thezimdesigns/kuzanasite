import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink, MonitorPlay, Pin } from "lucide-react";
import { db } from "@/lib/db";
import type { QuestionStatus, SessionType } from "@/lib/generated/prisma/enums";
import { ASKABLE } from "@/lib/qa";
import { can, requireStaff } from "@/lib/permissions";
import { formatTime } from "@/lib/time";
import { deleteQuestion, pinQuestion, setQuestionStatus } from "@/app/admin/actions/engagement";
import { ActionButton } from "@/components/admin/admin-form";
import { AdminPage, ReadOnlyNotice, Tabs } from "@/components/admin/ui";
import { AutoRefresh } from "@/components/public/auto-refresh";
import { Badge } from "@/components/ui";

export const metadata = { title: "Q&A moderation" };

const TABS = ["PENDING", "APPROVED", "ANSWERED", "HIDDEN", "CONTRIBUTIONS"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = { PENDING: "Waiting", APPROVED: "Live list", ANSWERED: "Answered", HIDDEN: "Hidden", CONTRIBUTIONS: "Contributions" };

export default async function AdminQaConference({ params, searchParams }: PageProps<"/admin/qa/[id]">) {
  const user = await requireStaff();
  const editable = can(user, "qa");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const tab: Tab = TABS.includes(sp.tab as Tab) ? (sp.tab as Tab) : "PENDING";
  const sessionFilter = typeof sp.session === "string" ? sp.session : "";

  const event = await db.event.findUnique({
    where: { id },
    include: { sessions: { where: { publishStatus: "PUBLISHED", type: { in: ASKABLE as SessionType[] } }, orderBy: [{ startsAt: "asc" }, { sortOrder: "asc" }], select: { id: true, title: true, startsAt: true } } },
  });
  if (!event) notFound();

  const base = { eventId: id, ...(sessionFilter === "general" ? { sessionId: null } : sessionFilter ? { sessionId: sessionFilter } : {}) };
  const [questions, counts] = await Promise.all([
    db.conferenceQuestion.findMany({
      where: tab === "CONTRIBUTIONS" ? { ...base, kind: "CONTRIBUTION", status: { not: "HIDDEN" } } : { ...base, kind: "QUESTION", status: tab },
      orderBy: tab === "APPROVED" ? [{ pinned: "desc" }, { votes: "desc" }, { createdAt: "asc" }] : [{ createdAt: tab === "PENDING" ? "asc" : "desc" }],
      include: { session: { select: { title: true } } },
    }),
    db.conferenceQuestion.groupBy({ by: ["status", "kind"], where: base, _count: true }),
  ]);
  const countOf = (t: Tab) =>
    counts
      .filter((c) => (t === "CONTRIBUTIONS" ? c.kind === "CONTRIBUTION" && c.status !== "HIDDEN" : c.kind === "QUESTION" && c.status === t))
      .reduce((n, c) => n + c._count, 0);
  const href = (patch: Record<string, string>) => {
    const q = new URLSearchParams({ tab, ...(sessionFilter && { session: sessionFilter }), ...patch });
    for (const [k, v] of [...q.entries()]) if (!v) q.delete(k);
    return `/admin/qa/${id}?${q}`;
  };
  const act = (status: QuestionStatus, qid: string) => setQuestionStatus.bind(null, qid, status);

  return (
    <AdminPage
      title={`Q&A: ${event.title}`}
      back={{ href: "/admin/qa", label: "Conference Q&A" }}
      actions={
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
          <Link href={`/qa-screen/${event.slug}`} target="_blank" className="inline-flex items-center gap-1 text-green-800 underline">
            <MonitorPlay className="size-4" /> Hall screen
          </Link>
          <Link href={`/events/${event.slug}/qa`} target="_blank" className="inline-flex items-center gap-1 text-green-800 underline">
            Public page <ExternalLink className="size-3.5" />
          </Link>
          <a href={`/admin/qa/${id}/export`} className="inline-flex items-center gap-1 text-green-800 underline">
            <Download className="size-4" /> Export CSV
          </a>
        </div>
      }
    >
      <AutoRefresh seconds={10} />
      {!editable && <ReadOnlyNotice />}
      <nav aria-label="Filter by session" className="mb-4 flex flex-wrap gap-1.5">
        {[{ id: "", title: "All sessions" }, ...event.sessions, { id: "general", title: "General" }].map((s) => (
          <Link
            key={s.id || "all"}
            href={href({ session: s.id })}
            className={`rounded-[var(--radius-control)] border px-2.5 py-1 text-xs font-semibold ${sessionFilter === s.id ? "border-green-900 bg-green-900 text-white" : "border-line bg-white text-green-900 hover:border-green-800"}`}
          >
            {"startsAt" in s ? `${formatTime(s.startsAt)} ` : ""}
            {s.title.length > 40 ? `${s.title.slice(0, 40)}…` : s.title}
          </Link>
        ))}
      </nav>
      <Tabs current={tab} tabs={TABS.map((t) => ({ value: t, label: TAB_LABELS[t], count: countOf(t), href: href({ tab: t }) }))} />

      <ul className="space-y-3">
        {questions.map((q) => (
          <li key={q.id} className={`rounded-[var(--radius-card)] border bg-white p-4 ${q.pinned ? "border-orange shadow-[var(--shadow-lift)]" : "border-line"}`}>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              {q.pinned && (
                <Badge tone="orange">
                  <Pin className="size-3" /> On screen now
                </Badge>
              )}
              {q.kind === "QUESTION" && <span className="font-semibold text-green-900">{q.votes} votes</span>}
              <span>{formatTime(q.createdAt)}</span>
              <span>· {q.session?.title ?? "General"}</span>
            </div>
            <p className="mt-2 text-[1.02rem] leading-relaxed whitespace-pre-line">{q.body}</p>
            <p className="mt-1 text-sm text-muted">{[q.name ?? "Anonymous", q.organisation].filter(Boolean).join(", ")}</p>
            {editable && (
              <div className="mt-3 flex flex-wrap gap-2">
                {q.kind === "CONTRIBUTION" ? (
                  <>
                    {q.status !== "ANSWERED" && <ActionButton action={act("ANSWERED", q.id)}>Mark reviewed</ActionButton>}
                    <ActionButton action={act("HIDDEN", q.id)} variant="ghost">
                      Hide
                    </ActionButton>
                  </>
                ) : q.status === "PENDING" ? (
                  <>
                    <ActionButton action={act("APPROVED", q.id)} variant="primary">
                      Approve
                    </ActionButton>
                    <ActionButton action={pinQuestion.bind(null, q.id, true)}>Approve & put on screen</ActionButton>
                    <ActionButton action={act("HIDDEN", q.id)} variant="ghost">
                      Hide
                    </ActionButton>
                  </>
                ) : q.status === "APPROVED" ? (
                  <>
                    {q.pinned ? (
                      <ActionButton action={pinQuestion.bind(null, q.id, false)}>Take off screen</ActionButton>
                    ) : (
                      <ActionButton action={pinQuestion.bind(null, q.id, true)} variant="primary">
                        Put on screen
                      </ActionButton>
                    )}
                    <ActionButton action={act("ANSWERED", q.id)}>Mark answered</ActionButton>
                    <ActionButton action={act("HIDDEN", q.id)} variant="ghost">
                      Hide
                    </ActionButton>
                  </>
                ) : q.status === "ANSWERED" ? (
                  <ActionButton action={act("APPROVED", q.id)} variant="ghost">
                    Back to live list
                  </ActionButton>
                ) : (
                  <>
                    <ActionButton action={act("APPROVED", q.id)}>Restore</ActionButton>
                    <ActionButton action={deleteQuestion.bind(null, q.id)} variant="ghost" confirm="Delete this question for good?">
                      Delete
                    </ActionButton>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
        {questions.length === 0 && <p className="rounded-[var(--radius-card)] border border-dashed border-line p-8 text-center text-sm text-muted">Nothing here right now. This list refreshes by itself.</p>}
      </ul>
    </AdminPage>
  );
}
