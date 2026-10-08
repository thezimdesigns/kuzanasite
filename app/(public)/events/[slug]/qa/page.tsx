import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Mic } from "lucide-react";
import { db } from "@/lib/db";
import { getQaConference, qaAutoApprove, voterId } from "@/lib/qa";
import { formatTime } from "@/lib/time";
import { AutoRefresh } from "@/components/public/auto-refresh";
import { QaAskForm, VoteButton } from "@/components/public/qa";
import { cn, EmptyState, PageHeader, Section } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/events/[slug]/qa">): Promise<Metadata> {
  const qa = await getQaConference((await params).slug);
  return qa ? { title: `Questions: ${qa.event.title}`, description: `Ask the panel a question or share a contribution at ${qa.event.title}.` } : {};
}

export default async function ConferenceQaPage({ params, searchParams }: PageProps<"/events/[slug]/qa">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const qa = await getQaConference(slug);
  if (!qa || !qa.event.isConference) notFound();
  const { event, sessions, currentSessionId } = qa;

  // ?session=<id> | general | all. By default, follow the session on stage now.
  const requested = typeof sp.session === "string" ? sp.session : null;
  const filter = requested === "all" || requested === "general" || sessions.some((s) => s.id === requested) ? requested! : (currentSessionId ?? "all");
  const sessionWhere = filter === "all" ? {} : filter === "general" ? { sessionId: null } : { sessionId: filter };

  const questions = await db.conferenceQuestion.findMany({
    where: { eventId: event.id, kind: "QUESTION", status: { in: ["APPROVED", "ANSWERED"] }, ...sessionWhere },
    orderBy: [{ pinned: "desc" }, { votes: "desc" }, { createdAt: "asc" }],
    include: { session: { select: { title: true } } },
  });
  const [voter, autoApprove] = await Promise.all([voterId(false), qaAutoApprove()]);
  const voted = new Set(
    voter && questions.length
      ? (await db.questionVote.findMany({ where: { voter, questionId: { in: questions.map((q) => q.id) } }, select: { questionId: true } })).map((v) => v.questionId)
      : [],
  );
  const open = questions.filter((q) => q.status === "APPROVED");
  const answered = questions.filter((q) => q.status === "ANSWERED");
  const sessionLabel = (s: { title: string; startsAt: Date }) => `${formatTime(s.startsAt)} · ${s.title}`;
  const chip = (value: string, label: string, live = false) => (
    <Link
      key={value}
      href={`/events/${event.slug}/qa?session=${value}`}
      scroll={false}
      aria-current={filter === value ? "true" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] border px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors",
        filter === value ? "border-green-900 bg-green-900 text-white" : "border-line bg-white text-green-900 hover:border-green-800",
      )}
    >
      {live && <span className="live-dot size-1.5 rounded-full bg-orange" aria-hidden />}
      {label}
    </Link>
  );

  return (
    <>
      <AutoRefresh seconds={20} />
      <PageHeader
        back={{ href: `/events/${event.slug}`, label: event.title }}
        title="Questions & contributions"
        intro="Ask the speakers and panellists a question, vote for the questions you want answered, or share a contribution for the conference report."
      />
      <Section className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <div className="order-2 min-w-0 lg:order-1">
          <nav aria-label="Filter by session" className="-mx-4 mb-5 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {chip("all", "All sessions")}
            {sessions.map((s) => chip(s.id, s.title.replace(/^Panel (\d+):.*/, "Panel $1").slice(0, 42), s.id === currentSessionId && s.status === "LIVE"))}
            {chip("general", "General")}
          </nav>

          {open.length ? (
            <ol className="space-y-3">
              {open.map((q) => (
                <li
                  key={q.id}
                  className={cn("flex gap-4 rounded-[var(--radius-card)] border bg-white p-4", q.pinned ? "border-orange shadow-[var(--shadow-lift)]" : "border-line")}
                >
                  <VoteButton questionId={q.id} votes={q.votes} voted={voted.has(q.id)} />
                  <div className="min-w-0 flex-1">
                    {q.pinned && (
                      <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-orange-dark uppercase">
                        <Mic className="size-3.5" aria-hidden /> Being answered now
                      </p>
                    )}
                    <p className="text-[1.02rem] leading-relaxed whitespace-pre-line text-ink">{q.body}</p>
                    <p className="mt-2 text-xs text-muted">
                      {[q.name ?? "Anonymous", q.organisation].filter(Boolean).join(", ")}
                      {filter === "all" && ` · ${q.session?.title ?? "General"}`}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState>No questions here yet. Be the first to ask.</EmptyState>
          )}

          {answered.length > 0 && (
            <details className="group mt-8">
              <summary className="cursor-pointer list-none font-heading font-bold text-green-900 [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-green-800" aria-hidden /> Answered ({answered.length})
                </span>
              </summary>
              <ol className="mt-3 space-y-2">
                {answered.map((q) => (
                  <li key={q.id} className="rounded-[var(--radius-card)] border border-line bg-white/70 p-3.5 text-sm text-muted">
                    <p className="text-ink">{q.body}</p>
                    <p className="mt-1 text-xs">
                      {q.votes} votes · {q.name ?? "Anonymous"}
                    </p>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>

        <div className="order-1 rounded-[var(--radius-card)] border border-line bg-white p-5 sm:p-6 lg:sticky lg:top-24 lg:order-2">
          <QaAskForm
            eventId={event.id}
            sessions={sessions.map((s) => ({ id: s.id, label: sessionLabel(s) }))}
            sessionId={filter !== "all" && filter !== "general" ? filter : currentSessionId}
          />
          <p className="mt-4 text-xs text-muted">
            {autoApprove ? "Questions appear in the list straight away." : "Questions appear once a moderator approves them."} Contributions go to the organisers only.
          </p>
        </div>
      </Section>
    </>
  );
}
