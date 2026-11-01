import Link from "next/link";
import { ArrowRight, CalendarPlus } from "lucide-react";
import { editionDates, getSiteState } from "@/lib/edition";

/**
 * For live-only pages (Live now, Today) outside event week: says when KUZANA
 * is back and points to what is happening in the meantime.
 */
export async function BetweenNotice({ title }: { title: string }) {
  const { next, past } = await getSiteState();
  return (
    <section className="bg-ivory-pattern">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <p className="text-sm font-bold tracking-[0.1em] text-orange-dark uppercase">{title}</p>
        <h1 className="mt-2 font-heading text-4xl leading-tight font-extrabold text-balance text-green-900 sm:text-5xl">
          {next ? (
            <>
              KUZANA returns <span className="text-orange-dark">{editionDates(next)}</span>
            </>
          ) : (
            "Nothing is on right now"
          )}
        </h1>
        <p className="mx-auto mt-4 max-w-[52ch] text-lg text-pretty text-muted">
          This page comes alive during the expo week. In the meantime, read the stories of the people who took part, or find out how to be part of the next
          edition.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/stories"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] bg-green-900 px-5 py-3 font-heading font-bold text-white transition-colors hover:bg-green-800"
          >
            Read the stories <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/take-part"
            className="inline-flex items-center justify-center rounded-[var(--radius-control)] border border-green-900/30 bg-white px-5 py-3 font-heading font-semibold text-green-900 transition-colors hover:border-green-900"
          >
            Take part{next ? ` in ${next.year}` : ""}
          </Link>
          {next && (
            <a
              href="/save-the-date.ics"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] px-5 py-3 font-heading font-semibold text-green-900 hover:bg-white"
            >
              <CalendarPlus className="size-4" aria-hidden /> Save the date
            </a>
          )}
        </div>
        {past && (
          <p className="mt-8 text-sm text-muted">
            Looking for {past.year}?{" "}
            <Link href={`/archive/${past.year}`} className="font-semibold text-green-800 underline">
              KUZANA SCEEZ {past.year} in review
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
