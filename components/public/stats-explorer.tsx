"use client";

import { useMemo, useState } from "react";
import { changeFrom, findValue, formatNumber, groupTotal, type StatGroup } from "@/lib/stats";
import { BAR_LIGHT, StatsBoard } from "@/components/public/stats-board";
import { cn } from "@/components/ui";

export type ExplorerDay = {
  key: string;
  /** "Day 2" or the short date when the day number is unknown. */
  label: string;
  /** "Thursday, 8 October 2026" */
  date: string;
  short: string;
  headline: string | null;
  note: string | null;
  groups: StatGroup[];
};

const WEEK = "week";

/**
 * KUZANA in numbers: pick a day to see its figures (with the change from the
 * day before), or "The week" to compare every day side by side.
 * Days are passed oldest first. The choice is kept in the address (?day=… or
 * ?view=week) so a specific view can be shared.
 */
export function StatsExplorer({ days, initial }: { days: ExplorerDay[]; initial: string }) {
  const [view, setView] = useState(initial);
  const select = (v: string) => {
    setView(v);
    const url = new URL(window.location.href);
    url.searchParams.delete("day");
    url.searchParams.delete("view");
    if (v === WEEK) url.searchParams.set("view", WEEK);
    else url.searchParams.set("day", v);
    window.history.replaceState(null, "", url);
  };
  const index = days.findIndex((d) => d.key === view);
  const day = index >= 0 ? days[index] : null;
  const previous = index > 0 ? days[index - 1] : null;

  return (
    <div>
      <div role="tablist" aria-label="Choose a day" className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {days.map((d) => (
          <Tab key={d.key} active={view === d.key} onClick={() => select(d.key)}>
            <span className="block font-heading text-base font-extrabold">{d.label}</span>
            <span className="block text-xs opacity-80">{d.short}</span>
          </Tab>
        ))}
        {days.length > 1 && (
          <Tab active={view === WEEK} onClick={() => select(WEEK)}>
            <span className="block font-heading text-base font-extrabold">The week</span>
            <span className="block text-xs opacity-80">Compare days</span>
          </Tab>
        )}
      </div>

      {day ? (
        <div key={day.key} className="animate-[fade-in_0.35s_ease-out_both] motion-reduce:animate-none">
          <header className="mb-7">
            <h2 className="font-heading text-2xl font-extrabold tracking-[-0.02em] text-green-900">{day.date}</h2>
            {day.headline && <p className="mt-1 max-w-[60ch] text-lg">{day.headline}</p>}
          </header>
          <StatsBoard groups={day.groups} previous={previous?.groups} previousLabel={previous?.label} />
          {day.note && <p className="mt-8 max-w-[65ch] text-sm text-muted">{day.note}</p>}
        </div>
      ) : (
        <WeekView days={days} />
      )}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      data-fx="tap"
      className={cn(
        "min-w-28 shrink-0 rounded-[var(--radius-control)] border px-4 py-2.5 text-left transition-colors",
        active ? "border-green-900 bg-green-900 text-white" : "border-line bg-white text-green-900 hover:border-green-800",
      )}
    >
      {children}
    </button>
  );
}

/** Every group across every day, as bar charts. */
function WeekView({ days }: { days: ExplorerDay[] }) {
  // Groups in the order they first appear, matched across days by title.
  const titles = useMemo(() => {
    const seen = new Map<string, string>();
    for (const d of days) for (const g of d.groups) if (!seen.has(g.title.toLowerCase())) seen.set(g.title.toLowerCase(), g.title);
    return [...seen.values()];
  }, [days]);
  return (
    <div className="grid animate-[fade-in_0.35s_ease-out_both] gap-12 motion-reduce:animate-none lg:grid-cols-2">
      {titles.map((t) => (
        <GroupChart key={t} title={t} days={days} />
      ))}
    </div>
  );
}

type Bar = { day: ExplorerDay; dayIndex: number; label: string; value: number; colour: string };

function GroupChart({ title, days }: { title: string; days: ExplorerDay[] }) {
  const perDay = days.map((d) => d.groups.find((g) => g.title.toLowerCase() === title.toLowerCase()) ?? null);
  const sample = perDay.find(Boolean)!;
  const totals = sample.showTotal;
  // Series: one per figure label, in first-seen order.
  const labels = [...new Set(perDay.flatMap((g) => g?.items.map((i) => i.label) ?? []))];
  const colour = (label: string) => BAR_LIGHT[labels.indexOf(label) % BAR_LIGHT.length];
  const values = perDay.flatMap((g) => (g ? (totals ? [groupTotal(g)] : g.items.map((i) => i.value)) : []));
  const max = Math.max(1, ...values);
  const [picked, setPicked] = useState<Bar | null>(null);

  const describe = (b: Bar) => {
    const prevDay = days[b.dayIndex - 1];
    const prev = prevDay ? findValue(prevDay.groups, title, totals ? undefined : b.label) : undefined;
    const c = changeFrom(b.value, prev);
    const change = c && c.diff !== 0 ? `, ${c.diff > 0 ? "+" : "-"}${formatNumber(Math.abs(c.diff))}${c.pct !== null ? ` (${c.diff > 0 ? "+" : "-"}${Math.abs(c.pct)}%)` : ""} on ${prevDay.label}` : "";
    return `${b.day.label}, ${b.day.short}: ${totals ? "total" : b.label.toLowerCase()} ${formatNumber(b.value)}${change}`;
  };

  return (
    <section aria-label={`${title} by day`}>
      <h3 className="text-sm font-bold tracking-[0.08em] text-muted uppercase">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {(totals ? ["Total"] : labels).map((l) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full", totals ? BAR_LIGHT[0] : colour(l))} aria-hidden />
            {l}
          </span>
        ))}
      </div>

      <div className="mt-5 grid h-56 items-end gap-3" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map((d, di) => {
          const g = perDay[di];
          const bars: Bar[] = g
            ? totals
              ? [{ day: d, dayIndex: di, label: "Total", value: groupTotal(g), colour: BAR_LIGHT[0] }]
              : g.items.map((i) => ({ day: d, dayIndex: di, label: i.label, value: i.value, colour: colour(i.label) }))
            : [];
          return (
            <div key={d.key} className="flex h-full items-end justify-center gap-1.5">
              {bars.length ? (
                bars.map((b) => {
                  const active = picked?.day.key === b.day.key && picked.label === b.label;
                  return (
                    <button
                      key={b.label}
                      type="button"
                      onClick={() => setPicked(b)}
                      onMouseEnter={() => setPicked(b)}
                      onFocus={() => setPicked(b)}
                      aria-label={describe(b)}
                      data-fx="none"
                      className="group flex h-full w-full max-w-14 flex-col items-center justify-end"
                    >
                      <span className={cn("mb-1 font-heading text-sm font-bold tabular-nums", active ? "text-orange-deeper" : "text-green-900")}>{formatNumber(b.value)}</span>
                      <span
                        className={cn(
                          "block w-full origin-bottom rounded-t-[var(--radius-badge)] transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)] motion-safe:animate-[bar-rise_0.7s_var(--ease-out-expo)_both]",
                          b.colour,
                          picked && !active && "opacity-40",
                        )}
                        style={{ height: `${Math.max(2, (b.value / max) * 100)}%` }}
                      />
                    </button>
                  );
                })
              ) : (
                <span className="self-center text-xs text-muted">Not recorded</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 grid gap-3 border-t border-line pt-2 text-center text-xs" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map((d) => (
          <span key={d.key}>
            <span className="block font-semibold text-ink">{d.label}</span>
            <span className="block text-muted">{d.short}</span>
          </span>
        ))}
      </div>
      <p className="mt-3 min-h-5 text-sm text-ink" aria-live="polite">
        {picked ? describe(picked) : <span className="text-muted">Tap a bar for the exact figure and change.</span>}
      </p>
      {perDay.map((g, i) => g?.note && <p key={i} className="text-xs text-muted">{`${days[i].label}: ${g.note}`}</p>)}
    </section>
  );
}
