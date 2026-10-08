"use client";

import { useState } from "react";
import { ExternalLink, Radio } from "lucide-react";
import { streamEmbed, streamHost, type StreamLink } from "@/lib/streams";
import { cn } from "@/components/ui";

/**
 * One or more live streams. Embeddable streams (YouTube, Facebook video) play
 * in place and can be switched with the tabs; other links open in a new tab.
 */
export function StreamPlayer({ streams, title, live }: { streams: StreamLink[]; title: string; live?: boolean }) {
  const embeddable = streams.filter((s) => streamEmbed(s.url));
  const links = streams.filter((s) => !streamEmbed(s.url));
  const [currentId, setCurrentId] = useState(embeddable[0]?.id);
  const current = embeddable.find((s) => s.id === currentId) ?? embeddable[0];
  const embed = current && streamEmbed(current.url);

  return (
    <div className="space-y-3">
      {embeddable.length > 1 && (
        <div role="tablist" aria-label="Choose a stream" className="flex flex-wrap gap-1.5">
          {embeddable.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === current?.id}
              onClick={() => setCurrentId(s.id)}
              className={cn(
                "rounded-[var(--radius-control)] border px-3 py-1.5 text-sm font-semibold transition-colors",
                s.id === current?.id ? "border-green-900 bg-green-900 text-white" : "border-line bg-white text-green-900 hover:border-green-800",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      {embed && (
        <div className="relative aspect-video overflow-hidden rounded-[var(--radius-card)] border border-line bg-green-950">
          <iframe
            key={embed.src}
            src={embed.src}
            title={`${title}: ${current.label}`}
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 size-full"
          />
        </div>
      )}
      {links.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {links.map((s) => (
            <li key={s.id}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener"
                className={cn(
                  "inline-flex items-center gap-2 rounded-[var(--radius-control)] px-3.5 py-2 text-sm font-semibold transition-colors",
                  live ? "bg-orange text-white hover:bg-orange-dark" : "border border-line bg-white text-green-900 hover:border-green-800",
                )}
              >
                <Radio className="size-4" aria-hidden />
                {s.label}
                <span className={cn("text-xs font-normal", live ? "text-white/80" : "text-muted")}>{streamHost(s.url)}</span>
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
