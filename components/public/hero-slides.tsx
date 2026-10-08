"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/components/ui";

type Slide = { id: string; src: string; alt: string };

const INTERVAL_MS = 6500;

/**
 * Background photos for the homepage hero: crossfade with a slow push-in,
 * under a dark green tint. Pausable; static for reduced-motion users.
 */
export function HeroSlides({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setIndex((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [slides.length, paused]);

  return (
    <>
      <div className="absolute inset-0 overflow-hidden bg-green-950" aria-hidden>
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={cn("absolute inset-0 transition-opacity duration-[1400ms] ease-[var(--ease-out-expo)]", i === index ? "opacity-100" : "opacity-0")}
          >
            <Image src={s.src} alt="" fill priority={i === 0} sizes="100vw" className={cn("object-cover", i === index && "hero-push")} />
          </div>
        ))}
        {/* Tint: strongest behind the text column, lighter towards the photo. */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-950/95 via-green-950/80 to-green-950/40" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-green-950/70 to-transparent" />
      </div>

      {slides.length > 1 && (
        <div className="absolute right-4 bottom-4 z-10 flex items-center gap-2 sm:right-6 sm:bottom-6">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}: ${s.alt || "KUZANA"}`}
              aria-current={i === index}
              className="group py-2"
            >
              <span
                className={cn(
                  "block h-1 rounded-full transition-[width,background-color] duration-500",
                  i === index ? "w-8 bg-orange-bright" : "w-4 bg-white/45 group-hover:bg-white/80",
                )}
              />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Play background photos" : "Pause background photos"}
            className="ml-1 inline-flex size-8 items-center justify-center rounded-[var(--radius-control)] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </button>
        </div>
      )}
    </>
  );
}
