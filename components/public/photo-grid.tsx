"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";

type Photo = { id: string; src: string; caption: string | null; width: number | null; height: number | null };

/** Lazy-loaded photo grid with a keyboard- and swipe-friendly lightbox. */
export function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const touchX = useRef(0);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? null : (i + d + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, step]);

  const current = open !== null ? photos[open] : null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.id}>
            <button type="button" onClick={() => setOpen(i)} className="relative block aspect-square w-full overflow-hidden rounded-lg bg-cream-dark">
              <Image src={p.src} alt={p.caption ?? ""} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          }}
        >
          <div className="flex items-center justify-between p-3 text-white">
            <span className="text-sm">
              {open! + 1} / {photos.length}
            </span>
            <div className="flex gap-2">
              <a href={`${current.src}?name=kuzana-photo-${open! + 1}.jpg`} className="rounded-full p-2 hover:bg-white/10" aria-label="Download photo">
                <Download className="size-6" />
              </a>
              <button type="button" onClick={close} className="rounded-full p-2 hover:bg-white/10" aria-label="Close">
                <X className="size-6" />
              </button>
            </div>
          </div>
          <div className="relative flex-1">
            <Image src={current.src} alt={current.caption ?? ""} fill sizes="100vw" className="object-contain" />
            <button type="button" onClick={() => step(-1)} className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white" aria-label="Previous">
              <ChevronLeft className="size-7" />
            </button>
            <button type="button" onClick={() => step(1)} className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white" aria-label="Next">
              <ChevronRight className="size-7" />
            </button>
          </div>
          {current.caption && <p className="p-4 text-center text-sm text-white">{current.caption}</p>}
        </div>
      )}
    </>
  );
}
