"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUp } from "lucide-react";
import { playSfx, sfxEnabled, setSfxEnabled, subscribeSfx, type Sfx } from "@/components/public/sfx";
import { cn } from "@/components/ui";

/** Plays the sound named in data-sfx="kick|drum" on any clicked element (only when switched on). */
export function SfxListener() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-sfx]");
      const kind = el?.dataset.sfx as Sfx | undefined;
      if (kind === "kick" || kind === "drum") playSfx(kind);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}

/** Switch for the optional sound effects. */
export function SfxToggle({ tone = "light" }: { tone?: "light" | "dark" }) {
  const on = useSyncExternalStore(subscribeSfx, sfxEnabled, () => false);
  return (
    <label className={cn("flex cursor-pointer items-center justify-between gap-3 text-sm", tone === "dark" ? "text-white/85" : "text-ink")}>
      <span>
        <span className="block font-semibold">Sound effects</span>
        <span className={cn("block text-xs", tone === "dark" ? "text-white/60" : "text-muted")}>A drum or a ball kick on some buttons</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={on}
        onChange={(e) => {
          setSfxEnabled(e.target.checked);
          if (e.target.checked) playSfx("drum");
        }}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-orange-dark",
          on ? "bg-orange-dark" : tone === "dark" ? "bg-white/25" : "bg-line",
        )}
      >
        <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", on && "translate-x-5")} />
      </span>
    </label>
  );
}

/**
 * "Back to top" button, bottom right. Appears once the page has scrolled past
 * a marker (IntersectionObserver, no scroll listeners); sits above the phone tab bar.
 */
export function ScrollToTop() {
  const marker = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!marker.current) return;
    const io = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(marker.current);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div ref={marker} aria-hidden className="pointer-events-none absolute top-[600px] left-0 h-px w-px" />
      <button
        type="button"
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          })
        }
        aria-label="Back to top"
        tabIndex={show ? 0 : -1}
        className={cn(
          "fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] bg-green-900 text-white shadow-[var(--shadow-lift)] transition-[opacity,transform] duration-300 ease-[var(--ease-out-expo)] hover:bg-green-800 active:scale-95 lg:right-6 lg:bottom-6",
          show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <ArrowUp className="size-5" />
      </button>
    </>
  );
}
