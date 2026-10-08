"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/components/ui";

const FloorPlanView = dynamic(() => import("@/components/map/floor-plan-view").then((m) => m.FloorPlanView), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse bg-cream-dark" />,
});

export type ExplorerStall = {
  id: string;
  label: string;
  x: number;
  y: number;
  exhibitor: { name: string; slug: string; sector: string | null } | null;
};

/** Floor plan with a search box and a stand list that zooms to a stand. */
export function FloorPlanExplorer({
  imageUrl,
  width,
  height,
  stalls,
  initialFocus,
}: {
  imageUrl: string;
  width: number;
  height: number;
  stalls: ExplorerStall[];
  initialFocus?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [focusId, setFocusId] = useState<string | null>(initialFocus ?? null);
  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      stalls
        .filter((s) => !q || s.label.toLowerCase().includes(q) || s.exhibitor?.name.toLowerCase().includes(q) || s.exhibitor?.sector?.toLowerCase().includes(q))
        // Exhibitors A–Z first, then unassigned stands by number.
        .sort(
          (a, b) =>
            Number(!a.exhibitor) - Number(!b.exhibitor) ||
            (a.exhibitor?.name ?? a.label).localeCompare(b.exhibitor?.name ?? b.label, undefined, { numeric: true }),
        ),
    [stalls, q],
  );
  const highlight = useMemo(() => new Set(q ? matches.map((s) => s.id) : focusId ? [focusId] : []), [q, matches, focusId]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="relative h-[68dvh] min-h-[380px] overflow-hidden rounded-[var(--radius-card)] border border-line lg:h-[75dvh]">
        <FloorPlanView
          imageUrl={imageUrl}
          width={width}
          height={height}
          className="h-full"
          focusId={focusId}
          highlight={highlight}
          stalls={stalls.map((s) => ({
            id: s.id,
            label: s.label,
            x: s.x,
            y: s.y,
            empty: !s.exhibitor,
            title: s.exhibitor?.name,
            subtitle: s.exhibitor?.sector ?? undefined,
            link: s.exhibitor
              ? {
                  href: `/exhibitors/${s.exhibitor.slug}`,
                  label: "View exhibitor",
                }
              : undefined,
          }))}
          onStallClick={setFocusId}
        />
      </div>

      <div className="flex min-h-0 flex-col lg:h-[75dvh]">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find an exhibitor or stand"
            aria-label="Find an exhibitor or stand"
            className="h-11 w-full rounded-[var(--radius-control)] border border-line bg-white pr-9 pl-9 text-[0.95rem] outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/15"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </label>
        <p className="mt-2 text-xs text-muted" aria-live="polite">
          {q ? `${matches.length} of ${stalls.length} stands` : `${stalls.length} stands`}
        </p>
        <ul className="mt-2 max-h-80 flex-1 divide-y divide-line overflow-y-auto rounded-[var(--radius-card)] border border-line bg-white lg:max-h-none">
          {matches.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setFocusId(s.id)}
                className={cn("flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-cream", s.id === focusId && "bg-orange-50")}
              >
                <span
                  className={cn(
                    "inline-flex h-6 min-w-9 items-center justify-center rounded-[var(--radius-badge)] px-1.5 font-heading text-xs font-extrabold",
                    s.exhibitor ? "bg-green-900 text-white" : "border border-green-900 text-green-900",
                  )}
                >
                  {s.label}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{s.exhibitor?.name ?? "Unassigned stand"}</span>
                  {s.exhibitor?.sector && <span className="block truncate text-xs text-muted">{s.exhibitor.sector}</span>}
                </span>
              </button>
            </li>
          ))}
          {matches.length === 0 && <li className="px-3 py-4 text-sm text-muted">No stand matches “{query}”.</li>}
        </ul>
      </div>
    </div>
  );
}
