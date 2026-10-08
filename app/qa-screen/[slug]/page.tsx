import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ChevronUp, Mic } from "lucide-react";
import { db } from "@/lib/db";
import { getQaConference } from "@/lib/qa";
import { siteUrl } from "@/lib/site";
import { AutoRefresh } from "@/components/public/auto-refresh";

export const metadata: Metadata = { title: "Questions", robots: { index: false } };

/**
 * Projector view for the conference hall: the question being answered, the
 * most-voted questions, and a QR code to ask from a phone. Refreshes itself.
 */
export default async function QaScreen({ params }: PageProps<"/qa-screen/[slug]">) {
  const qa = await getQaConference((await params).slug);
  if (!qa || !qa.event.isConference) notFound();
  const { event, sessions, currentSessionId } = qa;

  const questions = await db.conferenceQuestion.findMany({
    where: { eventId: event.id, kind: "QUESTION", status: "APPROVED" },
    orderBy: [{ pinned: "desc" }, { votes: "desc" }, { createdAt: "asc" }],
    take: 6,
    include: { session: { select: { title: true } } },
  });
  const pinned = questions.find((q) => q.pinned);
  const top = questions.filter((q) => !q.pinned).slice(0, pinned ? 4 : 5);
  const session = pinned?.session?.title ?? sessions.find((s) => s.id === currentSessionId)?.title;
  const askUrl = siteUrl(`/events/${event.slug}/qa`);
  const qr = await QRCode.toString(askUrl, { type: "svg", margin: 1, color: { dark: "#023a1d", light: "#ffffff" } });

  return (
    <main className="flex min-h-dvh flex-col bg-green-950 p-[3vmin] text-white">
      <AutoRefresh seconds={6} />
      <header className="flex items-start justify-between gap-[3vmin]">
        <div>
          <p className="text-[2.2vmin] font-bold tracking-[0.12em] text-orange-bright uppercase">{event.title}</p>
          {session && <p className="mt-[0.6vmin] text-[3vmin] font-semibold text-white/80">{session}</p>}
        </div>
        <div className="flex items-center gap-[2vmin] rounded-[1.2vmin] bg-white p-[1.2vmin] pr-[2.2vmin] text-green-950">
          <span className="block size-[13vmin] [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
          <span>
            <span className="block font-heading text-[2.8vmin] leading-tight font-extrabold">Ask a question</span>
            <span className="block text-[1.8vmin]">Scan, or visit</span>
            <span className="block text-[1.8vmin] font-semibold">{askUrl.replace(/^https?:\/\//, "")}</span>
          </span>
        </div>
      </header>

      <section className="flex flex-1 items-center py-[3vmin]" aria-live="polite">
        {pinned ? (
          <div>
            <p className="inline-flex items-center gap-[1vmin] rounded-[0.8vmin] bg-orange-bright px-[1.6vmin] py-[0.6vmin] text-[2.2vmin] font-bold text-green-950">
              <Mic className="size-[2.6vmin]" aria-hidden /> Now answering
            </p>
            <p className="mt-[2.5vmin] max-w-[85vw] font-heading text-[5.6vmin] leading-[1.15] font-extrabold text-balance">{pinned.body}</p>
            <p className="mt-[2vmin] text-[2.6vmin] text-white/75">
              {[pinned.name ?? "Anonymous", pinned.organisation].filter(Boolean).join(", ")} · {pinned.votes} votes
            </p>
          </div>
        ) : (
          <p className="font-heading text-[6vmin] leading-tight font-extrabold text-balance text-white/90">
            Scan the code to ask the panel a question,
            <br />
            <span className="text-orange-bright">and vote for the ones you want answered.</span>
          </p>
        )}
      </section>

      {top.length > 0 && (
        <section aria-label="Most voted questions">
          <p className="mb-[1.4vmin] text-[2vmin] font-bold tracking-[0.12em] text-white/60 uppercase">Most voted</p>
          <ol className="grid gap-[1.4vmin] md:grid-cols-2">
            {top.map((q) => (
              <li key={q.id} className="flex items-start gap-[1.6vmin] rounded-[1vmin] border border-white/15 bg-white/[0.06] p-[1.6vmin]">
                <span className="flex min-w-[6vmin] flex-col items-center rounded-[0.8vmin] bg-white/10 py-[0.6vmin] text-orange-bright">
                  <ChevronUp className="size-[2.4vmin]" aria-hidden />
                  <span className="font-heading text-[2.6vmin] leading-none font-extrabold tabular-nums">{q.votes}</span>
                </span>
                <span className="text-[2.3vmin] leading-snug line-clamp-3">{q.body}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
