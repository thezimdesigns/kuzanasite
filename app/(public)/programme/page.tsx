import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getEditionEvents, type ProgrammeItem } from "@/lib/programme";
import { computeStatus, dateKey, effectiveEnd, formatLongDay, startOfDay } from "@/lib/time";
import { ProgrammeList } from "@/components/public/programme-list";
import { ShareButtons } from "@/components/public/share-buttons";
import { cn, EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Programme",
  description: "The full KUZANA SCEEZ programme: exhibitions, conferences, sport and music across Bulawayo.",
};

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
      when === "live" ? status === "LIVE" : when === "upcoming" ? !["COMPLETED", "CANCELLED"].includes(status) : when === "completed" ? status === "COMPLETED" : true,
    );

  // Group by each day the event touches, so multi-day events appear every day.
  const days = new Map<string, ProgrammeItem[]>();
  for (const { e, status } of filtered) {
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
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        timeTbc: e.timeTbc || first !== last,
        status,
        statusNote: e.statusNote,
        venue: e.venue?.name ?? null,
        room: e.room,
      });
    }
  }
  const sortedDays = [...days.entries()].sort(([a], [b]) => a.localeCompare(b));
  const today = dateKey(now);

  const filterLink = (key: string, value: string) => {
    const params = new URLSearchParams({ ...(category && { category }), ...(venue && { venue }), ...(when && { when }) });
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    return qs ? `/programme?${qs}` : "/programme";
  };

  return (
    <>
      <PageHeader title="Programme" intro="Every KUZANA SCEEZ event, day by day. Tap an event for times, venue and details.">
        <ShareButtons title="KUZANA SCEEZ 2026 programme" path="/programme" />
      </PageHeader>
      <Section>
        <div className="mb-6 space-y-3">
          <FilterRow
            label="Show"
            options={[
              ["", "All"],
              ["live", "Live now"],
              ["upcoming", "Upcoming"],
              ["completed", "Completed"],
            ]}
            current={when}
            href={(v) => filterLink("when", v)}
          />
          <FilterRow
            label="Category"
            options={[["", "All"], ...categories.map((c) => [c.slug, c.name] as [string, string])]}
            current={category}
            href={(v) => filterLink("category", v)}
          />
          <FilterRow
            label="Venue"
            options={[["", "All"], ...venues.map((v) => [v.slug, v.name] as [string, string])]}
            current={venue}
            href={(v) => filterLink("venue", v)}
          />
        </div>

        {sortedDays.length === 0 ? (
          <EmptyState>No events match these filters.</EmptyState>
        ) : (
          <div className="space-y-10">
            {sortedDays.map(([key, items]) => (
              <section key={key} aria-labelledby={`day-${key}`}>
                <h2 id={`day-${key}`} className="mb-3 flex items-center gap-3 text-xl font-extrabold text-green-900">
                  {formatLongDay(startOfDay(key))}
                  {key === today && <span className="rounded-full bg-orange px-2.5 py-0.5 text-xs text-white uppercase">Today</span>}
                </h2>
                <ProgrammeList items={items} />
                <Link href={`/programme/${key}`} className="mt-2 inline-block text-sm font-semibold text-green-800 underline">
                  Full day including sessions
                </Link>
              </section>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

function FilterRow({
  label,
  options,
  current,
  href,
}: {
  label: string;
  options: [string, string][];
  current: string;
  href: (value: string) => string;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <span className="shrink-0 text-sm font-semibold text-muted">{label}:</span>
      {options.map(([value, text]) => (
        <Link
          key={value || "all"}
          href={href(value)}
          scroll={false}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold whitespace-nowrap",
            current === value ? "border-green-900 bg-green-900 text-white" : "border-line bg-white hover:border-green-800",
          )}
        >
          {text}
        </Link>
      ))}
    </div>
  );
}
