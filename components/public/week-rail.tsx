"use client";

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/components/ui";

/**
 * The week as a timeline you scroll through: finished events to the left,
 * a "Now" marker, then what's on and what's next to the right. It opens at
 * the marker, so the first view is what's live or coming up; "Earlier" and
 * "Coming up" (and edge fades) show which way leads where.
 */
export function WeekRail({ past, ahead, label }: { past: ReactNode[]; ahead: ReactNode[]; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const now = useRef<HTMLDivElement>(null);
  const home = useRef(0);
  const [edges, setEdges] = useState({ start: true, end: false, home: true });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
      // Resting at "Now": the marker itself says the past is to the left, so no fade over it.
      home: Math.abs(el.scrollLeft - home.current) <= 8,
    });
  }, []);

  // Open at "Now" (before paint, so the past never flashes into view).
  useLayoutEffect(() => {
    const el = track.current;
    const marker = now.current;
    if (el && marker) {
      el.scrollLeft = marker.offsetLeft - el.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft);
      home.current = el.scrollLeft;
    }
    measure();
  }, [measure]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  };

  const card = "w-[78%] shrink-0 sm:w-[42%] lg:w-[calc(25%-0.75rem)]";

  return (
    <div>
      <div className="relative">
        <div
          ref={track}
          role="region"
          aria-label={label}
          tabIndex={0}
          onScroll={measure}
          className="rail -mx-4 flex scroll-px-4 gap-4 overflow-x-auto px-4 pb-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-dark sm:mx-0 sm:scroll-px-0 sm:px-0"
        >
          {past.map((p, i) => (
            <div key={`past-${i}`} className={cn(card, "opacity-75 transition-opacity duration-300 hover:opacity-100 focus-within:opacity-100")}>
              {p}
            </div>
          ))}
          {past.length > 0 && (
            // Where the past ends and today begins. Scroll target on load.
            <div ref={now} aria-hidden className="flex w-12 shrink-0 flex-col items-center gap-2 py-2 [scroll-snap-align:start]">
              <span className="rounded-[var(--radius-badge)] bg-orange px-1.5 py-0.5 text-[11px] font-bold text-white">Now</span>
              <span className="w-px flex-1 bg-gradient-to-b from-orange to-transparent" />
            </div>
          )}
          {ahead.map((a, i) => (
            <div key={`ahead-${i}`} className={card}>
              {a}
            </div>
          ))}
        </div>
        {/* Edge fades only where there is more to see. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-cream to-transparent transition-opacity duration-300 sm:-left-1",
            edges.start || edges.home ? "opacity-0" : "opacity-100",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-cream to-transparent transition-opacity duration-300 sm:-right-1",
            edges.end ? "opacity-0" : "opacity-100",
          )}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <RailButton onClick={() => page(-1)} disabled={edges.start} label={past.length ? `Earlier, ${past.length} completed` : "Earlier"}>
          <ArrowLeft className="size-4" aria-hidden /> Earlier
          {past.length > 0 && <span className="font-normal text-muted tabular-nums">{past.length} completed</span>}
        </RailButton>
        <RailButton onClick={() => page(1)} disabled={edges.end} label="Coming up">
          Coming up <ArrowRight className="size-4" aria-hidden />
        </RailButton>
      </div>
    </div>
  );
}

function RailButton({ onClick, disabled, label, children }: { onClick: () => void; disabled: boolean; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      data-fx="tap"
      className="inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-line bg-white px-3.5 py-2 text-sm font-semibold text-green-900 transition-[border-color,opacity,transform] duration-200 hover:border-green-800/60 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
