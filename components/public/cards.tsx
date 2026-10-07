import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, Play } from "lucide-react";
import type { ProgrammeStatus } from "@/lib/generated/prisma/enums";
import { fileUrl } from "@/lib/files";
import { formatDate, formatRange } from "@/lib/time";
import { youtubeThumb } from "@/lib/youtube";
import { Badge } from "@/components/ui";
import { StatusBadge } from "@/components/public/status-badge";

export function EventCard({
  event,
  status,
}: {
  event: {
    slug: string;
    title: string;
    summary: string | null;
    startsAt: Date;
    endsAt: Date | null;
    timeTbc: boolean;
    imageKey: string | null;
    posterKey: string | null;
    venue: { name: string } | null;
    category?: { name: string } | null;
  };
  status?: ProgrammeStatus;
}) {
  const image = fileUrl(event.imageKey ?? event.posterKey);
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition-colors hover:border-green-800"
    >
      {image && (
        <div className="relative aspect-[16/9] bg-cream-dark">
          <Image src={image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {event.category && <Badge tone="green">{event.category.name}</Badge>}
          {status && <StatusBadge status={status} hideUpcoming />}
        </div>
        <h3 className="font-heading text-lg font-bold group-hover:text-green-800">{event.title}</h3>
        {event.summary && <p className="mt-1 line-clamp-2 text-sm text-muted">{event.summary}</p>}
        <div className="mt-auto space-y-1 pt-3 text-sm">
          <p className="flex items-center gap-1.5 font-semibold text-green-900">
            <CalendarDays className="size-4" aria-hidden />
            {formatRange(event.startsAt, event.endsAt, event.timeTbc)}
          </p>
          {event.venue && (
            <p className="flex items-center gap-1.5 text-muted">
              <MapPin className="size-4 text-orange" aria-hidden />
              {event.venue.name}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function AlbumCard({
  album,
}: {
  album: { slug: string; title: string; date: Date | null; coverKey: string | null; _count?: { photos: number }; photos?: { key: string }[] };
}) {
  const cover = fileUrl(album.coverKey ?? album.photos?.[0]?.key);
  return (
    <Link href={`/gallery/${album.slug}`} className="group block overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
      <div className="relative aspect-[4/3] bg-cream-dark">
        {cover && (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform group-hover:scale-[1.02]"
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
      className="group block overflow-hidden rounded-[var(--radius-card)] border border-line bg-white"
    >
      <div className="relative aspect-video bg-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={youtubeThumb(video.youtubeId)} alt="" loading="lazy" className="size-full object-cover opacity-90" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-orange p-3 text-white shadow-lg transition-transform group-hover:scale-110">
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
      className="group flex gap-3 rounded-[var(--radius-card)] border border-line bg-white p-3 transition-colors hover:border-green-800"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-cream-dark">
        {image ? (
          <Image src={image} alt="" fill sizes="64px" className={exhibitor.logoKey ? "object-contain p-1" : "object-cover"} />
        ) : (
          <span className="flex size-full items-center justify-center font-heading text-xl font-extrabold text-green-900">
            {exhibitor.name.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="font-heading font-bold leading-snug group-hover:text-green-800">{exhibitor.name}</h3>
        <p className="mt-0.5 text-xs text-muted">
          {[exhibitor.category?.name, exhibitor.hall && `Hall ${exhibitor.hall}`, exhibitor.stand && `Stand ${exhibitor.stand}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {exhibitor.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{exhibitor.description}</p>}
      </div>
    </Link>
  );
}
