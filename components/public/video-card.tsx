"use client";

import { useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { formatDate } from "@/lib/time";
import { youtubeThumb } from "@/lib/youtube";

/**
 * Video thumbnail that plays in a lightbox. It stays a real link to YouTube,
 * so a middle or Ctrl click still opens a new tab, but a normal click plays here.
 */
export function VideoCard({ video }: { video: { youtubeId: string; title: string; date: Date | null } }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [open]);

  return (
    <>
      <a
        href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          setOpen(true);
        }}
        className="group block overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition-[box-shadow,transform] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
        aria-label={`Play video: ${video.title}`}
      >
        <div className="relative aspect-video overflow-hidden bg-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={youtubeThumb(video.youtubeId)}
            alt=""
            loading="lazy"
            className="size-full object-cover opacity-90 transition-[transform,opacity] duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04] group-hover:opacity-100"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-orange-dark p-3 text-white shadow-[0_8px_24px_-6px_rgb(0_0_0/0.5)] transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-110">
              <Play className="size-6 fill-current" />
            </span>
          </span>
        </div>
        <div className="p-3">
          <h3 className="line-clamp-2 font-heading leading-snug font-bold">{video.title}</h3>
          {video.date && <p className="mt-0.5 text-xs text-muted">{formatDate(new Date(video.date))}</p>}
        </div>
      </a>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={video.title}
          className="fixed inset-0 z-50 flex animate-[fade-in_0.2s_ease-out_both] flex-col bg-[rgb(6_14_10/0.96)] motion-reduce:animate-none"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="flex items-center justify-between gap-3 p-3 text-white">
            <p className="line-clamp-1 text-sm font-semibold">{video.title}</p>
            <button ref={closeRef} type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white/10" aria-label="Close">
              <X className="size-6" />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center p-3 sm:p-8" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
            <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-[var(--radius-card)] bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                title={video.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="size-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
