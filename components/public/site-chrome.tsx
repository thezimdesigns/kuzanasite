"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/components/ui";

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
