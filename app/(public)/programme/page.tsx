import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { eventBanner, eventOnDay, getEditionEvents, venueMapUrl, type ProgrammeItem } from "@/lib/programme";
import { computeStatus, dateKey, effectiveEnd, startOfDay, TIME_ZONE } from "@/lib/time";
import { AutoSubmitSelect } from "@/components/public/auto-submit-select";
import { ProgrammeList } from "@/components/public/programme-list";
import { ShareButtons } from "@/components/public/share-buttons";
import { WeekStrip } from "@/components/public/week-strip";
import { Button, cn, EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Programme",
  description: "The full KUZANA SCEEZ programme: exhibitions, conferences, sport and music across Bulawayo.",
};

const WHEN = [
  ["", "All"],
  ["live", "Live now"],
  ["upcoming", "Still to come"],
  ["completed", "Finished"],
] as const;

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, ...o });
const weekdayFmt = fmt({ weekday: "long" });
const dayFmt = fmt({ day: "2-digit" });
const monthFmt = fmt({ month: "long" });

export default async function ProgrammePage({ searchParams }: PageProps<"/programme">) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : "";
  const venue = typeof sp.venue === "string" ? sp.venue : "";
  const when = typeof sp.when === "string" ? sp.when : "";

  const [events, categories, venues] = await Promise.all([
    getEditionEvents(),
    db.eventCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    db.venue.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const now = new Date();
  const filtered = events
    .map((e) => ({ e, status: computeStatus(e, now) }))
    .filter(({ e }) => !category || e.category?.slug === category)
    .filter(({ e }) => !venue || e.venue?.slug === venue)
    .filter(({ status }) =>
      when === "live"
        ? status === "LIVE"
        : when === "upcoming"
          ? !["COMPLETED", "CANCELLED"].includes(status)
          : when === "completed"
            ? status === "COMPLETED"
            : true,
    );

  // Group by each day the event touches, so multi-day events appear every day.
  const days = new Map<string, ProgrammeItem[]>();
  for (const { e } of filtered) {
    const first = dateKey(e.startsAt);
    const last = dateKey(effectiveEnd(e));
    for (let d = startOfDay(first); dateKey(d) <= last; d = new Date(d.getTime() + 86_400_000)) {
      const key = dateKey(d);
      if (!days.has(key)) days.set(key, []);
      days.get(key)!.push({
        kind: "event",
        id: e.id,
        title: e.title,
        href: `/events/${e.slug}`,
        ...eventOnDay(e, key, now),
        statusNote: e.statusNote,
        venue: e.venue?.name ?? null,
        room: e.room,
        posterKey: e.posterKey ?? e.imageKey,
        pdf: e.programmePdfKey ? { key: e.programmePdfKey, name: e.programmePdfName } : null,
        // The banner shows once, on the event's first day.
        banner: key === first ? eventBanner(e) : null,
        venueMapUrl: venueMapUrl(e.venue),
        watchHref: e._count.streams ? `/events/${e.slug}#watch` : null,
      });
    }
  }
  const sortedDays = [...days.entries()].sort(([a], [b]) => a.localeCompare(b));
  const today = dateKey(now);
  const qs = (patch: Record<string, string>) => {
    const p = new URLSearchParams({
      ...(category && { category }),
      ...(venue && { venue }),
      ...(when && { when }),
      ...patch,
    });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    const s = p.toString();
    return s ? `/programme?${s}` : "/programme";
  };

  return (
    <>
      <PageHeader title="Programme" intro="Every KUZANA SCEEZ event, day by day. Tap an event for times, venue and details.">
        <WeekStrip />
      </PageHeader>

      {/* Filters: one compact bar instead of three rows of chips. */}
      <div className="border-b border-line bg-white">
        <form className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between" action="/programme">
          {when && <input type="hidden" name="when" value={when} />}
          <div role="group" aria-label="Show" className="rail -mx-4 flex overflow-x-auto px-4 md:mx-0 md:px-0">
            <div className="inline-flex rounded-[var(--radius-control)] border border-line bg-cream p-0.5">
              {WHEN.map(([value, label]) => (
                <Link
                  key={value || "all"}
                  href={qs({ when: value })}
                  scroll={false}
                  aria-current={when === value ? "true" : undefined}
                  className={cn(
                    "rounded-[calc(var(--radius-control)-2px)] px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors",
                    when === value ? "bg-green-900 text-white" : "text-ink hover:bg-white",
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:flex">
            <label className="sr-only" htmlFor="f-category">
              Category
            </label>
            <AutoSubmitSelect id="f-category" name="category" defaultValue={category} className="py-2 text-sm md:w-44">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </AutoSubmitSelect>
            <label className="sr-only" htmlFor="f-venue">
              Venue
            </label>
            <AutoSubmitSelect id="f-venue" name="venue" defaultValue={venue} className="py-2 text-sm md:w-56">
              <option value="">All venues</option>
              {venues.map((v) => (
                <option key={v.id} value={v.slug}>
                  {v.name}
                </option>
              ))}
            </AutoSubmitSelect>
            <noscript>
              <Button type="submit" size="sm" variant="secondary">
                Apply
              </Button>
            </noscript>
          </div>
        </form>
      </div>

      <Section>
        {sortedDays.length === 0 ? (
          <EmptyState>
            No events match these filters.{" "}
            <Link href="/programme" className="font-semibold text-green-800 underline">
              Show everything
            </Link>
          </EmptyState>
        ) : (
          <div className="space-y-12">
            {sortedDays.map(([key, items]) => {
              const date = startOfDay(key);
              const isToday = key === today;
              const dayHref = isToday ? "/programme/today" : `/programme/${key}`;
              return (
                <section key={key} aria-labelledby={`day-${key}`} className="grid gap-4 lg:grid-cols-[11rem_1fr] lg:gap-8">
                  <header className="lg:sticky lg:top-24 lg:self-start">
                    <h2 id={`day-${key}`} className="flex items-center gap-3 font-heading text-green-900 lg:block">
                      <span className="text-5xl leading-none font-extrabold tracking-[-0.04em] tabular-nums lg:text-6xl">{dayFmt.format(date)}</span>
                      <span className="lg:mt-2 lg:block">
                        <span className="block text-lg leading-tight font-bold">{weekdayFmt.format(date)}</span>
                        <span className="block text-sm font-medium text-muted">{monthFmt.format(date)}</span>
                      </span>
                    </h2>
                    {isToday && (
                      <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-dark">
                        <span className="live-dot inline-block size-2 rounded-full bg-orange" aria-hidden /> Today
                      </span>
                    )}
                    <Link href={dayHref} className="group mt-3 hidden items-center gap-1 text-sm font-semibold text-green-800 lg:flex">
                      Sessions and times <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </header>
                  <div>
                    <ProgrammeList items={items} />
                    <Link href={dayHref} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-green-800 lg:hidden">
                      Sessions and times <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </section>
              );
            })}
          </div>
        )}
        <div className="mt-14 border-t border-line pt-6">
          <p className="mb-3 text-sm font-semibold text-muted">Share the programme</p>
          <ShareButtons title="KUZANA SCEEZ 2026 programme" path="/programme" />
        </div>
      </Section>
    </>
  );
}
