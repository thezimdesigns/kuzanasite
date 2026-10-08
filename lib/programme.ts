import "server-only";
import { db } from "@/lib/db";
import { getCurrentEdition } from "@/lib/edition";
import type { ProgrammeStatus } from "@/lib/generated/prisma/enums";
import { googleMapsUrl } from "@/lib/geo";
import { computeStatus, dailyWindow, dateKey, endOfDay, formatDay, isDaily, occursOn, startOfDay } from "@/lib/time";

export type ProgrammeItem = {
  kind: "event" | "session";
  id: string;
  title: string;
  href: string;
  startsAt: Date;
  endsAt: Date | null;
  timeTbc: boolean;
  status: ProgrammeStatus;
  statusNote?: string | null;
  venue: string | null;
  room: string | null;
  parentTitle?: string;
  category?: string | null;
  posterKey?: string | null;
  pdf?: { key: string; name: string | null } | null;
  banner?: { wide: string; mobile: string | null } | null;
  venueMapUrl?: string | null;
  /** For events open the same hours every day, e.g. "Open daily · Wed 7 Oct – Sat 10 Oct". */
  dailyNote?: string | null;
  /** Link to the stream players when live streams are set. */
  watchHref?: string | null;
};

const activeStreams = {
  _count: { select: { streams: { where: { active: true } } } },
} as const;

/** Google Maps link for a venue: its pin if set, else its saved map link. */
export function venueMapUrl(
  v: {
    latitude: number | null;
    longitude: number | null;
    mapUrl: string | null;
  } | null,
) {
  if (!v) return null;
  if (v.latitude != null && v.longitude != null) return googleMapsUrl(v.latitude, v.longitude);
  return v.mapUrl;
}

/**
 * Times and status of an event on one day of the programme. Events with daily
 * hours show that day's opening and closing; other multi-day events show TBC.
 */
export function eventOnDay(
  e: { startsAt: Date; endsAt: Date | null; timeTbc: boolean; dailyHours: boolean; statusOverride: ProgrammeStatus | null },
  key: string,
  now: Date,
) {
  if (isDaily(e)) {
    const day = dailyWindow(e, key);
    return {
      ...day,
      timeTbc: false,
      status: e.statusOverride ?? computeStatus({ ...day, statusOverride: null }, now),
      dailyNote: `Open daily · ${formatDay(e.startsAt)} – ${formatDay(e.endsAt!)}`,
    };
  }
  const multiDay = !!e.endsAt && dateKey(e.startsAt) !== dateKey(e.endsAt);
  return { startsAt: e.startsAt, endsAt: e.endsAt, timeTbc: e.timeTbc || multiDay, status: computeStatus(e, now), dailyNote: null };
}

export function eventBanner(e: { bannerKey: string | null; bannerMobileKey: string | null }) {
  return e.bannerKey ? { wide: e.bannerKey, mobile: e.bannerMobileKey } : null;
}

/** Published events of the current edition, ordered by start. */
export async function getEditionEvents() {
  const edition = await getCurrentEdition();
  if (!edition) return [];
  return db.event.findMany({
    where: { editionId: edition.id, publishStatus: "PUBLISHED" },
    include: { venue: true, category: true, ...activeStreams },
    orderBy: [{ startsAt: "asc" }, { sortOrder: "asc" }],
  });
}

/**
 * Events and published conference sessions touching the given Harare day,
 * as one chronological list. Conferences with published sessions are shown
 * through their sessions rather than as a single block.
 */
export async function getDayProgramme(key = dateKey(new Date()), now = new Date()): Promise<ProgrammeItem[]> {
  const edition = await getCurrentEdition();
  if (!edition) return [];
  const dayStart = startOfDay(key);
  const dayEnd = endOfDay(key);

  const events = await db.event.findMany({
    where: {
      editionId: edition.id,
      publishStatus: "PUBLISHED",
      startsAt: { lte: dayEnd },
      OR: [{ endsAt: null }, { endsAt: { gte: dayStart } }],
    },
    include: {
      venue: true,
      category: true,
      ...activeStreams,
      sessions: {
        where: {
          publishStatus: "PUBLISHED",
          startsAt: { gte: dayStart, lte: dayEnd },
        },
        orderBy: [{ startsAt: "asc" }, { sortOrder: "asc" }],
        include: activeStreams,
      },
    },
  });

  const items: ProgrammeItem[] = [];
  for (const e of events) {
    if (!occursOn(e, key)) continue;
    items.push({
      kind: "event",
      id: e.id,
      title: e.title,
      href: `/events/${e.slug}`,
      ...eventOnDay(e, key, now),
      statusNote: e.statusNote,
      venue: e.venue?.name ?? null,
      room: e.room,
      category: e.category?.name,
      posterKey: e.posterKey ?? e.imageKey,
      pdf: e.programmePdfKey ? { key: e.programmePdfKey, name: e.programmePdfName } : null,
      banner: eventBanner(e),
      venueMapUrl: venueMapUrl(e.venue),
      watchHref: e._count.streams ? `/events/${e.slug}#watch` : null,
    });
    for (const s of e.sessions) {
      items.push({
        kind: "session",
        id: s.id,
        title: s.title,
        href: `/events/${e.slug}#session-${s.id}`,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        timeTbc: false,
        status: computeStatus(s, now),
        venue: e.venue?.name ?? null,
        room: s.room ?? e.room,
        parentTitle: e.title,
        posterKey: s.posterKey,
        venueMapUrl: venueMapUrl(e.venue),
        watchHref: s._count.streams ? `/events/${e.slug}#watch-${s.id}` : null,
      });
    }
  }
  return items.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime() || (a.kind === "event" ? -1 : 1));
}

/** Buckets for the Live board. */
export async function getLiveBoard(now = new Date()) {
  const today = await getDayProgramme(dateKey(now), now);
  const live = today.filter((i) => i.status === "LIVE");
  const startingSoon = today.filter((i) => i.status === "STARTING_SOON");
  const changed = today.filter((i) => ["POSTPONED", "CANCELLED", "VENUE_CHANGED"].includes(i.status));
  const laterToday = today.filter((i) => i.status === "UPCOMING");
  const next = await getUpcomingEvents(now, 4);
  return { today, live, startingSoon, changed, laterToday, next };
}

/** Published events starting after today, for "Coming up". */
export async function getUpcomingEvents(now = new Date(), take = 6) {
  const edition = await getCurrentEdition();
  if (!edition) return [];
  return db.event.findMany({
    where: {
      editionId: edition.id,
      publishStatus: "PUBLISHED",
      startsAt: { gt: endOfDay(dateKey(now)) },
    },
    include: { venue: true },
    orderBy: { startsAt: "asc" },
    take,
  });
}

/** Active announcements, most urgent first. */
export async function getActiveAnnouncements(take = 10) {
  return db.announcement.findMany({
    where: {
      publishStatus: "PUBLISHED",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: { event: { select: { title: true, slug: true } } },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take,
  });
}
