import Image from "next/image";
import Link from "next/link";
import { FileDown, MapPin, Radio } from "lucide-react";
import type { ProgrammeItem } from "@/lib/programme";
import { fileUrl } from "@/lib/files";
import { formatTime, formatTimes } from "@/lib/time";
import { cn } from "@/components/ui";
import { StatusBadge } from "@/components/public/status-badge";

/**
 * A list of programme rows. With `nest`, sessions whose event is also in the
 * list are shown inside that event's card ("now on stage") instead of as
 * separate cards; sessions without their event in the list stand alone.
 */
export function ProgrammeList({ items, className, nest = false }: { items: ProgrammeItem[]; className?: string; nest?: boolean }) {
  const eventIds = new Set(items.filter((i) => i.kind === "event").map((i) => i.id));
  const nested = (i: ProgrammeItem) => nest && i.kind === "session" && !!i.parentId && eventIds.has(i.parentId);
  return (
    <ol className={cn("reveal-list space-y-3", className)}>
      {items
        .filter((item) => !nested(item))
        .map((item) => (
          <li key={`${item.kind}-${item.id}`}>
            <ProgrammeRow item={item} sessions={nest && item.kind === "event" ? items.filter((s) => nested(s) && s.parentId === item.id) : []} />
          </li>
        ))}
    </ol>
  );
}

/** Responsive banner: the phone crop below 640px when provided, the wide image otherwise. */
export function ProgrammeBanner({ banner, className, priority }: { banner: { wide: string; mobile: string | null }; className?: string; priority?: boolean }) {
  const wide = fileUrl(banner.wide)!;
  const mobile = fileUrl(banner.mobile);
  return (
    <picture className={cn("block overflow-hidden bg-green-950", className)}>
      {mobile && <source media="(max-width: 639px)" srcSet={mobile} />}
      {}
      <img
        src={wide}
        alt=""
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="aspect-[16/7] w-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.02] sm:aspect-[4/1]"
      />
    </picture>
  );
}

/**
 * One programme entry. The title link stretches over the whole card, so the
 * PDF and map links can sit inside without nesting links.
 */
export function ProgrammeRow({ item, sessions = [] }: { item: ProgrammeItem; sessions?: ProgrammeItem[] }) {
  const done = item.status === "COMPLETED" || item.status === "CANCELLED";
  const live = item.status === "LIVE";
  const poster = fileUrl(item.posterKey);
  const [time, ...rest] = item.timeTbc ? ["TBC"] : formatTimes(item.startsAt, item.endsAt).split("–");
  const place = [item.room, item.venue].filter(Boolean).join(", ");

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-card)] border transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-out-expo)]",
        "hover:-translate-y-0.5 hover:border-green-800/50 hover:shadow-[var(--shadow-lift)]",
        // Solid fills: these cards also sit on dark panels, where a tint turns muddy.
        live ? "border-orange/60 bg-orange-50" : "border-line bg-white",
        done && "opacity-60 hover:opacity-100",
      )}
    >
      {item.banner && <ProgrammeBanner banner={item.banner} />}
      <div className="grid grid-cols-[4.25rem_1fr_auto] items-start gap-3 p-3.5 sm:grid-cols-[5.5rem_1fr_auto] sm:gap-5 sm:p-4">
        <div className="font-heading leading-tight text-green-900">
          <span className="block text-base font-bold tabular-nums sm:text-lg" title={item.timeTbc ? "Time to be confirmed" : undefined}>
            {time}
          </span>
          {rest.length > 0 && <span className="block text-xs font-medium text-muted tabular-nums">to {rest.join("–")}</span>}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className={cn("font-heading leading-snug font-bold text-ink", item.kind === "event" ? "text-[1.05rem] sm:text-lg" : "text-[0.95rem]")}>
              <Link href={item.href} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none">
                {item.title}
              </Link>
            </h3>
            <StatusBadge status={item.status} hideUpcoming />
          </div>
          {item.statusNote && <p className="mt-1 text-sm font-semibold text-danger">{item.statusNote}</p>}
          {item.parentTitle && <p className="mt-0.5 text-sm text-muted">{item.parentTitle}</p>}
          {item.dailyNote && <p className="mt-0.5 text-sm text-muted">{item.dailyNote}</p>}
          {(place || item.pdf || item.watchHref) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {place &&
                (item.venueMapUrl ? (
                  <a
                    href={item.venueMapUrl}
                    target="_blank"
                    rel="noopener"
                    className="relative z-10 inline-flex items-center gap-1 text-sm text-muted underline decoration-line underline-offset-2 transition-colors hover:text-green-900 hover:decoration-green-800"
                    title="Open in Google Maps"
                  >
                    <MapPin className="size-3.5 shrink-0 text-orange-dark" aria-hidden />
                    {place}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm text-muted">
                    <MapPin className="size-3.5 shrink-0 text-orange-dark" aria-hidden />
                    {place}
                  </span>
                ))}
              {item.pdf && (
                <a
                  href={fileUrl(item.pdf.key, item.pdf.name ?? `${item.title}.pdf`)!}
                  className="relative z-10 inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-900 transition-colors hover:bg-green-900 hover:text-white"
                >
                  <FileDown className="size-3.5" aria-hidden /> Programme PDF
                </a>
              )}
              {item.watchHref && !done && (
                <Link
                  href={item.watchHref}
                  className={cn(
                    "relative z-10 inline-flex items-center gap-1.5 rounded-[var(--radius-control)] px-2.5 py-1 text-xs font-semibold transition-colors",
                    live ? "bg-orange text-white hover:bg-orange-dark" : "bg-orange-50 text-orange-deeper hover:bg-orange hover:text-white",
                  )}
                >
                  <Radio className="size-3.5" aria-hidden /> {live ? "Watch live" : "Live stream"}
                </Link>
              )}
            </div>
          )}
        </div>

        {poster ? (
          <div className="relative h-20 w-16 overflow-hidden rounded-[var(--radius-control)] bg-cream-dark sm:h-24 sm:w-[4.5rem]">
            <Image
              src={poster}
              alt=""
              fill
              sizes="72px"
              className="object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-105"
            />
          </div>
        ) : (
          <span />
        )}
      </div>
      {sessions.length > 0 && (
        <ul className="relative z-10 divide-y divide-orange/15 border-t border-orange/25 bg-white" aria-label={`Now at ${item.title}`}>
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={s.href}
                className="grid grid-cols-[4.25rem_1fr] items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-cream sm:grid-cols-[5.5rem_1fr] sm:gap-5 sm:px-4"
              >
                <span className="font-heading text-sm font-bold text-green-900 tabular-nums">{formatTime(s.startsAt)}</span>
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[0.95rem] font-semibold text-ink">{s.title}</span>
                  <StatusBadge status={s.status} hideUpcoming />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
