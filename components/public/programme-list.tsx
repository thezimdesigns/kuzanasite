import Image from "next/image";
import Link from "next/link";
import { FileDown, MapPin } from "lucide-react";
import type { ProgrammeItem } from "@/lib/programme";
import { fileUrl } from "@/lib/files";
import { formatTimes } from "@/lib/time";
import { cn } from "@/components/ui";
import { StatusBadge } from "@/components/public/status-badge";

export function ProgrammeList({ items, className }: { items: ProgrammeItem[]; className?: string }) {
  return (
    <ol className={cn("reveal-list space-y-3", className)}>
      {items.map((item) => (
        <li key={`${item.kind}-${item.id}`}>
          <ProgrammeRow item={item} />
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
      { }
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
export function ProgrammeRow({ item }: { item: ProgrammeItem }) {
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
        live ? "border-orange/50 bg-orange-50/70" : "border-line bg-white",
        done && "opacity-60 hover:opacity-100",
        item.kind === "session" && "ml-3 sm:ml-6",
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
          {(place || item.pdf) && (
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
    </article>
  );
}
