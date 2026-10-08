"use client";

import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Horizontal scroll-snap row. Touch users swipe; pointer users get
 * previous/next buttons that page by roughly one viewport of cards.
 */
export function Rail({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: dir * el.clientWidth * 0.85,
      behavior: reduce ? "auto" : "smooth",
    });
  };
  return (
    <div className="relative">
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="rail -mx-4 flex gap-4 overflow-x-auto px-4 pb-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-dark sm:mx-0 sm:px-0"
      >
        {children}
      </div>
      <div className="mt-2 hidden justify-end gap-2 sm:flex">
        <RailButton onClick={() => page(-1)} label="Previous">
          <ChevronLeft className="size-5" />
        </RailButton>
        <RailButton onClick={() => page(1)} label="Next">
          <ChevronRight className="size-5" />
        </RailButton>
      </div>
    </div>
  );
}

function RailButton({ onClick, label, children }: { onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] border border-line bg-white text-green-900 transition-[border-color,transform] duration-200 hover:border-green-800/60 active:scale-95"
    >
      {children}
    </button>
  );
}
