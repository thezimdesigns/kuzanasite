import Image from "next/image";
import Link from "next/link";
import { CalendarDays, FileDown, MapPin, Play } from "lucide-react";
import type { ProgrammeStatus } from "@/lib/generated/prisma/enums";
import { fileUrl } from "@/lib/files";
import { dateKey, formatDate, formatRange, friendlyStatus, TIME_ZONE } from "@/lib/time";
import { youtubeThumb } from "@/lib/youtube";
import { FriendlyBadge } from "@/components/public/status-badge";
import { cn } from "@/components/ui";

type EventCardData = {
  slug: string;
  title: string;
  summary: string | null;
  startsAt: Date;
  endsAt: Date | null;
  timeTbc: boolean;
  dailyHours?: boolean;
  imageKey: string | null;
  posterKey: string | null;
  programmePdfKey?: string | null;
  programmePdfName?: string | null;
  venue: { name: string } | null;
  category?: { name: string } | null;
};

const dayNum = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "2-digit",
  }).format(d);
const monthShort = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    month: "short",
  }).format(d);

/**
 * Poster-led event card. Without a poster it shows a branded date tile so the
 * programme still reads as a set of distinct events, not identical boxes.
 */
export function EventCard({ event, status }: { event: EventCardData; status?: ProgrammeStatus }) {
  const poster = fileUrl(event.posterKey ?? event.imageKey);
  const multiDay = !!event.endsAt && dateKey(event.startsAt) !== dateKey(event.endsAt);
  const pdf = event.programmePdfKey ? fileUrl(event.programmePdfKey, event.programmePdfName ?? `${event.title}.pdf`) : null;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-green-800/40 hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-green-900">
        {poster ? (
          <Image
            src={poster}
            alt={`${event.title} poster`}
            fill
            sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 80vw"
            className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col justify-between bg-green-900 p-5 text-white">
            <span
              className="pointer-events-none absolute inset-0 bg-[url(/brand/soft-ivory-pattern.png)] bg-[length:260px] opacity-[0.07] transition-opacity duration-500 group-hover:opacity-[0.12]"
              aria-hidden
            />
            <span className="relative font-heading text-sm font-semibold text-gold-light">{event.category?.name ?? "KUZANA SCEEZ"}</span>
            <div className="relative font-heading leading-none">
              <span
                className={cn(
                  "block font-extrabold tracking-[-0.04em] tabular-nums transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-1",
                  multiDay ? "text-[4rem]" : "text-[5.5rem]",
                )}
              >
                {dayNum(event.startsAt)}
                {multiDay && <span className="text-gold-light">–{dayNum(event.endsAt!)}</span>}
              </span>
              <span className="mt-1 block text-lg font-bold tracking-wide text-white/85 uppercase">{monthShort(event.startsAt)} 2026</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {status && (
          <div className="mb-2">
            <FriendlyBadge status={friendlyStatus({ ...event, statusOverride: null }, status)} />
          </div>
        )}
        <h3 className="font-heading text-lg leading-snug font-bold text-balance text-ink">
          <Link href={`/events/${event.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {event.title}
          </Link>
        </h3>
        <div className="mt-auto space-y-1 pt-3 text-sm">
          <p className="flex items-center gap-1.5 font-semibold text-green-900">
            <CalendarDays className="size-4 shrink-0" aria-hidden />
            {formatRange(event.startsAt, event.endsAt, event.timeTbc, event.dailyHours)}
          </p>
          {event.venue && (
            <p className="flex items-center gap-1.5 text-muted">
              <MapPin className="size-4 shrink-0 text-orange-dark" aria-hidden />
              <span className="truncate">{event.venue.name}</span>
            </p>
          )}
        </div>
        {pdf && (
          <a
            href={pdf}
            className="relative z-10 mt-3 inline-flex w-fit items-center gap-1.5 rounded-[var(--radius-control)] bg-green-100 px-2.5 py-1.5 text-xs font-semibold text-green-900 transition-colors hover:bg-green-900 hover:text-white"
          >
            <FileDown className="size-3.5" aria-hidden /> Detailed programme (PDF)
          </a>
        )}
      </div>
    </article>
  );
}

export function AlbumCard({
  album,
}: {
  album: {
    slug: string;
    title: string;
    date: Date | null;
    coverKey: string | null;
    _count?: { photos: number };
    photos?: { key: string }[];
  };
}) {
  const cover = fileUrl(album.coverKey ?? album.photos?.[0]?.key);
  return (
    <Link
      href={`/gallery/${album.slug}`}
      className="group block overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition-[box-shadow,transform] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-[4/3] bg-cream-dark">
        {cover && (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
          />
        )}
      </div>
      <div className="p-3">
        <h3 className="font-heading font-bold leading-snug">{album.title}</h3>
        <p className="mt-0.5 text-xs text-muted">
          {album.date && formatDate(album.date)}
          {album._count && ` · ${album._count.photos} photos`}
        </p>
      </div>
    </Link>
  );
}

export function VideoCard({ video }: { video: { youtubeId: string; title: string; date: Date | null } }) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
      target="_blank"
      rel="noopener"
      className="group block overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition-[box-shadow,transform] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
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
        <h3 className="line-clamp-2 font-heading font-bold leading-snug">{video.title}</h3>
        {video.date && <p className="mt-0.5 text-xs text-muted">{formatDate(video.date)}</p>}
      </div>
    </a>
  );
}

export function ExhibitorCard({
  exhibitor,
}: {
  exhibitor: {
    slug: string;
    name: string;
    hall: string | null;
    stand: string | null;
    logoKey: string | null;
    description: string | null;
    category: { name: string } | null;
    media?: { key: string }[];
  };
}) {
  const image = fileUrl(exhibitor.logoKey ?? exhibitor.media?.[0]?.key);
  return (
    <Link
      href={`/exhibitors/${exhibitor.slug}`}
      className="group flex gap-3 rounded-[var(--radius-card)] border border-line bg-white p-3 transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-green-800/40 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-cream-dark">
        {image ? (
          <Image src={image} alt="" fill sizes="64px" className={exhibitor.logoKey ? "object-contain p-1" : "object-cover"} />
        ) : (
          <span className="flex size-full items-center justify-center font-heading text-xl font-extrabold text-green-900">{exhibitor.name.slice(0, 1)}</span>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="font-heading font-bold leading-snug group-hover:text-green-800">{exhibitor.name}</h3>
        <p className="mt-0.5 flex flex-wrap gap-x-2.5 text-xs text-muted">
          {[exhibitor.category?.name, exhibitor.hall && `Hall ${exhibitor.hall}`, exhibitor.stand && `Stand ${exhibitor.stand}`].filter(Boolean).map((t) => (
            <span key={t as string}>{t}</span>
          ))}
        </p>
        {exhibitor.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{exhibitor.description}</p>}
      </div>
    </Link>
  );
}
