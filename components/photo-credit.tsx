"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { cn } from "@/components/ui";

/**
 * A small camera button in the corner of a photo; clicking it shows who took
 * it (linked to the source when known). Closes on Escape or a click elsewhere.
 */
export function PhotoCredit({ credit, creditUrl, size = "md" }: { credit: string; creditUrl?: string | null; size?: "sm" | "md" }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={wrap} className="photo-credit absolute right-2 bottom-2">
      <button
        type="button"
        aria-label={`Photo credit: ${credit}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={cn(
          "grid place-items-center rounded-full bg-black/55 text-white ring-1 ring-white/25 backdrop-blur-sm transition-[background-color,transform] duration-200 hover:bg-black/75 active:scale-95",
          size === "sm" ? "size-7" : "size-8",
        )}
      >
        <Camera className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />
      </button>
      {open && (
        <span
          id={id}
          role="note"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 bottom-full mb-2 block w-max max-w-[min(18rem,70vw)] animate-[fade-up_0.18s_ease-out_both] rounded-[var(--radius-control)] bg-green-950 px-3 py-2 text-left text-xs leading-snug text-white shadow-[0_12px_32px_-12px_rgb(0_0_0/0.6)] motion-reduce:animate-none"
        >
          <span className="text-white/65">Photo: </span>
          {creditUrl ? (
            <a href={creditUrl} target="_blank" rel="noopener nofollow" className="font-semibold underline underline-offset-2">
              {credit}
            </a>
          ) : (
            <span className="font-semibold">{credit}</span>
          )}
        </span>
      )}
    </span>
  );
}
