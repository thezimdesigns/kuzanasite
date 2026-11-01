"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { LightboxViewer } from "@/components/public/lightbox";

type Photo = {
  id: string;
  src: string;
  caption: string | null;
  width: number | null;
  height: number | null;
};

/** Lazy-loaded photo grid with a keyboard- and swipe-friendly lightbox. */
export function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? null : (i + d + photos.length) % photos.length)), [photos.length]);

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-control)] bg-cream-dark"
              aria-label={`View photo ${i + 1}${p.caption ? `: ${p.caption}` : ""}`}
            >
              <Image src={p.src} alt={p.caption ?? ""} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>
      {open !== null && (
        <LightboxViewer
          items={photos.map((p) => ({ src: p.src, alt: p.caption ?? "", caption: p.caption }))}
          index={open}
          onClose={close}
          onStep={step}
          download
        />
      )}
    </>
  );
}
