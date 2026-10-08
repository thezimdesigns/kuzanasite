import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Info, Megaphone } from "lucide-react";
import { getActiveAnnouncements, getLiveBoard } from "@/lib/programme";
import { formatDay, formatLongDay, formatRange, formatTime } from "@/lib/time";
import { AutoRefresh } from "@/components/public/auto-refresh";
import { ProgrammeList } from "@/components/public/programme-list";
import { PushOptIn } from "@/components/public/push-opt-in";
import { ShareButtons } from "@/components/public/share-buttons";
import { cn, EmptyState, PageHeader, Section, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "KUZANA Live",
  description: "What's happening now at KUZANA SCEEZ: live events, what's next and the latest announcements.",
};

export default async function LivePage() {
  const now = new Date();
  const [board, announcements] = await Promise.all([getLiveBoard(now), getActiveAnnouncements(20)]);

  return (
    <>
      <AutoRefresh seconds={60} />
      <PageHeader
        title="What's happening now"
        intro={
          <span className="inline-flex flex-wrap items-center gap-x-2">
            <span className="live-dot inline-block size-2 rounded-full bg-orange" aria-hidden />
            {formatLongDay(now)}. Updated {formatTime(now)} and refreshing automatically.
          </span>
        }
      >
        <div className="flex flex-col gap-4">
          <PushOptIn />
          <ShareButtons title="KUZANA Live: what's happening now" path="/live" />
        </div>
      </PageHeader>

      {board.changed.length > 0 && (
        <Section className="pb-0">
          <SectionTitle>Programme changes</SectionTitle>
          <ProgrammeList items={board.changed} />
        </Section>
      )}

      <Section className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          <div>
            <SectionTitle>Live now</SectionTitle>
            {board.live.length ? <ProgrammeList items={board.live} nest /> : <EmptyState>Nothing is live at the moment.</EmptyState>}
          </div>
          {board.startingSoon.length > 0 && (
            <div>
              <SectionTitle>Starting soon</SectionTitle>
              <ProgrammeList items={board.startingSoon} />
            </div>
          )}
          <div>
            <SectionTitle action={<Link href="/programme/today" className="text-sm font-semibold text-green-800 underline">Full day</Link>}>
              Later today
            </SectionTitle>
            {board.laterToday.length ? (
              <ProgrammeList items={board.laterToday} />
            ) : (
              <EmptyState>Nothing else is scheduled for today.</EmptyState>
            )}
          </div>
          {board.next.length > 0 && (
            <div>
              <SectionTitle>Coming up</SectionTitle>
              <ul className="space-y-2">
                {board.next.map((e) => (
                  <li key={e.id}>
                    <Link href={`/events/${e.slug}`} className="flex flex-wrap items-baseline justify-between gap-2 rounded-[var(--radius-control)] border border-line bg-white px-4 py-3 hover:border-green-800">
                      <span className="font-heading font-bold">{e.title}</span>
                      <span className="text-sm text-muted">
                        {formatRange(e.startsAt, e.endsAt, e.timeTbc, e.dailyHours)}
                        {e.venue && ` · ${e.venue.name}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div id="announcements" className="scroll-mt-24">
          <SectionTitle>Announcements</SectionTitle>
          {announcements.length ? (
            <ul className="space-y-3">
              {announcements.map((a) => {
                const Icon = a.priority === "URGENT" ? AlertTriangle : a.priority === "IMPORTANT" ? Megaphone : Info;
                return (
                  <li
                    key={a.id}
                    className={cn(
                      "rounded-[var(--radius-card)] border bg-white p-4",
                      a.priority === "URGENT" ? "border-danger" : a.priority === "IMPORTANT" ? "border-gold" : "border-line",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className={cn(
                          "mt-0.5 size-5 shrink-0",
                          a.priority === "URGENT" ? "text-danger" : a.priority === "IMPORTANT" ? "text-gold" : "text-green-800",
                        )}
                      />
                      <div className="min-w-0">
                        <p className="font-heading font-bold">{a.title}</p>
                        {a.body && <p className="mt-1 text-sm whitespace-pre-line">{a.body}</p>}
                        <p className="mt-2 text-xs text-muted">
                          {formatDay(a.createdAt)} {formatTime(a.createdAt)}
                          {a.event && (
                            <>
                              {" · "}
                              <Link href={`/events/${a.event.slug}`} className="underline">
                                {a.event.title}
                              </Link>
                            </>
                          )}
                        </p>
                        {a.linkUrl && (
                          <a href={a.linkUrl} className="mt-2 inline-block text-sm font-semibold text-green-800 underline">
                            More information
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState>No announcements right now.</EmptyState>
          )}
        </div>
      </Section>
    </>
  );
}
