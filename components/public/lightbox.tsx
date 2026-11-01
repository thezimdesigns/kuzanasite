"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Camera, ChevronLeft, ChevronRight, Download, X } from "lucide-react";

export type LightboxItem = {
  src: string;
  alt: string;
  caption?: string | null;
  credit?: string | null;
  creditUrl?: string | null;
};

/**
 * Full-screen photo viewer: arrow keys, swipe, Escape. Focus moves to the
 * close button on open and back to whatever opened it on close.
 */
export function LightboxViewer({
  items,
  index,
  onClose,
  onStep,
  download = false,
}: {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onStep: (delta: number) => void;
  download?: boolean;
}) {
  const touchX = useRef(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const many = items.length > 1;
  const item = items[index];

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (many && e.key === "ArrowRight") onStep(1);
      if (many && e.key === "ArrowLeft") onStep(-1);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [many, onClose, onStep]);

  if (!item) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-50 flex animate-[fade-in_0.2s_ease-out_both] flex-col bg-[rgb(6_14_10/0.96)] motion-reduce:animate-none"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (many && Math.abs(dx) > 50) onStep(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between p-3 text-white">
        <span className="text-sm tabular-nums text-white/80">{many ? `${index + 1} / ${items.length}` : ""}</span>
        <div className="flex gap-1">
          {download && (
            <a href={`${item.src}?name=kuzana-photo-${index + 1}.jpg`} className="rounded-full p-2 hover:bg-white/10" aria-label="Download photo">
              <Download className="size-6" />
            </a>
          )}
          <button ref={closeRef} type="button" onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Close">
            <X className="size-6" />
          </button>
        </div>
      </div>
      <div className="relative flex-1" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <Image key={item.src} src={item.src} alt={item.alt} fill sizes="100vw" className="object-contain" />
        {many && (
          <>
            <button
              type="button"
              onClick={() => onStep(-1)}
              className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
              aria-label="Previous photo"
            >
              <ChevronLeft className="size-7" />
            </button>
            <button
              type="button"
              onClick={() => onStep(1)}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
              aria-label="Next photo"
            >
              <ChevronRight className="size-7" />
            </button>
          </>
        )}
      </div>
      {(item.caption || item.credit) && (
        <div className="mx-auto max-w-3xl space-y-1 p-4 text-center text-sm text-white">
          {item.caption && <p>{item.caption}</p>}
          {item.credit && (
            <p className="inline-flex items-center gap-1.5 text-xs text-white/70">
              <Camera className="size-3.5" aria-hidden />
              {item.creditUrl ? (
                <a href={item.creditUrl} target="_blank" rel="noopener nofollow" className="underline underline-offset-2 hover:text-white">
                  {item.credit}
                </a>
              ) : (
                item.credit
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Makes every element inside with data-lightbox="<index>" open the viewer at
 * that photo. The figures stay server-rendered; only this wrapper is client code.
 */
export function StoryLightbox({ items, children }: { items: LightboxItem[]; children: ReactNode }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? null : (i + d + items.length) % items.length)), [items.length]);
  return (
    <div
      onClick={(e) => {
        const trigger = (e.target as HTMLElement).closest<HTMLElement>("[data-lightbox]");
        if (!trigger) return;
        const i = Number(trigger.dataset.lightbox);
        if (items[i]) setOpen(i);
      }}
    >
      {children}
      {open !== null && <LightboxViewer items={items} index={open} onClose={close} onStep={step} />}
    </div>
  );
}
