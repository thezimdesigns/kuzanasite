import type { ProgrammeStatus } from "@/lib/generated/prisma/enums";

/** KUZANA runs in Bulawayo. Zimbabwe is UTC+2 all year (no daylight saving). */
export const TIME_ZONE = "Africa/Harare";
const OFFSET = "+02:00";
const OFFSET_MS = 2 * 60 * 60 * 1000;
const STARTING_SOON_MS = 30 * 60 * 1000;
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, ...options });

const timeFmt = fmt({ hour: "2-digit", minute: "2-digit", hour12: false });
const dayFmt = fmt({ weekday: "short", day: "numeric", month: "short" });
const longDayFmt = fmt({
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const dateFmt = fmt({ day: "numeric", month: "long", year: "numeric" });
const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

export const formatTime = (d: Date) => timeFmt.format(d);
export const formatDay = (d: Date) => dayFmt.format(d);
export const formatLongDay = (d: Date) => longDayFmt.format(d);
export const formatDate = (d: Date) => dateFmt.format(d);

/** YYYY-MM-DD in Harare time. */
export const dateKey = (d: Date) => keyFmt.format(d);

/** Start/end of the given Harare calendar day (YYYY-MM-DD) as UTC instants. */
export const startOfDay = (key: string) => new Date(`${key}T00:00:00${OFFSET}`);
export const endOfDay = (key: string) => new Date(`${key}T23:59:59.999${OFFSET}`);

/** Parse a datetime-local (or date) input value as Harare wall-clock time. */
export function parseLocalInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalised = value.length === 10 ? `${value}T00:00:00` : value.length === 16 ? `${value}:00` : value;
  const d = new Date(`${normalised}${OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Format a Date for a datetime-local input, in Harare wall-clock time. */
export function toLocalInput(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d.getTime() + OFFSET_MS).toISOString().slice(0, 16);
}

/** Format a Date for a date input, in Harare time. */
export const toDateInput = (d: Date | null | undefined) => (d ? dateKey(d) : "");

export function formatRange(startsAt: Date, endsAt: Date | null, timeTbc = false, dailyHours = false) {
  const startDay = dateKey(startsAt);
  const endDay = endsAt ? dateKey(endsAt) : startDay;
  if (endsAt && startDay !== endDay) {
    const days = `${formatDay(startsAt)} – ${formatDay(endsAt)}`;
    return dailyHours && !timeTbc ? `${days} · Daily ${formatTime(startsAt)}–${formatTime(endsAt)}` : days;
  }
  if (timeTbc) return `${formatDay(startsAt)} · Time TBC`;
  return `${formatDay(startsAt)} · ${formatTime(startsAt)}${endsAt ? `–${formatTime(endsAt)}` : ""}`;
}

export function formatTimes(startsAt: Date, endsAt: Date | null, timeTbc = false) {
  if (timeTbc) return "Time TBC";
  if (endsAt && dateKey(startsAt) !== dateKey(endsAt)) return formatRange(startsAt, endsAt);
  return `${formatTime(startsAt)}${endsAt ? `–${formatTime(endsAt)}` : ""}`;
}

export type Timed = {
  startsAt: Date;
  endsAt: Date | null;
  timeTbc?: boolean;
  /** Multi-day item open the same hours every day: the start time is the daily opening, the end time the daily closing. */
  dailyHours?: boolean;
  statusOverride: ProgrammeStatus | null;
};

const clock = (d: Date) => formatTime(d);

/** Whether an item runs on set hours each day of a multi-day run. */
export const isDaily = (item: Timed) => !!item.dailyHours && !item.timeTbc && !!item.endsAt && dateKey(item.startsAt) !== dateKey(item.endsAt);

/** Opening and closing on one day (YYYY-MM-DD) of a daily-hours item. */
export function dailyWindow(item: Timed, key: string) {
  return {
    startsAt: parseLocalInput(`${key}T${clock(item.startsAt)}`)!,
    endsAt: parseLocalInput(`${key}T${clock(item.endsAt!)}`)!,
  };
}

/** Effective end: explicit end, else end of day for TBC items, else start + 2h. */
export function effectiveEnd(item: Timed) {
  if (item.endsAt) return item.endsAt;
  if (item.timeTbc) return endOfDay(dateKey(item.startsAt));
  return new Date(item.startsAt.getTime() + DEFAULT_DURATION_MS);
}

/** Status inferred from the clock; an admin override always wins. */
export function computeStatus(item: Timed, now = new Date()): ProgrammeStatus {
  if (item.statusOverride) return item.statusOverride;
  // Daily hours: live only while open today; between days it is "upcoming" again.
  if (isDaily(item)) {
    const t = now.getTime();
    if (t >= item.endsAt!.getTime()) return "COMPLETED";
    const key = dateKey(now);
    const first = dateKey(item.startsAt);
    if (key < first) return computeStatus({ ...item, dailyHours: false, endsAt: dailyWindow(item, first).endsAt }, now);
    const today = dailyWindow(item, key);
    if (t >= today.startsAt.getTime() && t < today.endsAt.getTime()) return "LIVE";
    if (t < today.startsAt.getTime() && today.startsAt.getTime() - t <= STARTING_SOON_MS) return "STARTING_SOON";
    return "UPCOMING";
  }
  const start = item.startsAt.getTime();
  const end = effectiveEnd(item).getTime();
  const t = now.getTime();
  if (t >= end) return "COMPLETED";
  if (item.timeTbc) return "UPCOMING";
  if (t >= start) return "LIVE";
  if (start - t <= STARTING_SOON_MS) return "STARTING_SOON";
  return "UPCOMING";
}

/** True when the item's date range touches the given Harare day. */
export function occursOn(item: Timed, key: string) {
  return dateKey(item.startsAt) <= key && key <= dateKey(effectiveEnd(item));
}

export const STATUS_LABELS: Record<ProgrammeStatus, string> = {
  UPCOMING: "Upcoming",
  STARTING_SOON: "Starting soon",
  LIVE: "Live now",
  COMPLETED: "Completed",
  POSTPONED: "Postponed",
  CANCELLED: "Cancelled",
  VENUE_CHANGED: "Venue changed",
};

export type FriendlyStatus = { label: string; tone: "neutral" | "gold" | "orange" | "green" | "red"; live: boolean };

/**
 * The status in visitor words, for cards and event headers: "Live now",
 * "Ongoing" for a multi-day event between its opening hours, and "Later
 * today" / "Tomorrow" / "Coming up" instead of a bare "Upcoming".
 */
export function friendlyStatus(item: Timed, status: ProgrammeStatus, now = new Date()): FriendlyStatus {
  switch (status) {
    case "LIVE":
      return { label: "Live now", tone: "orange", live: true };
    case "STARTING_SOON":
      return { label: "Starting soon", tone: "gold", live: false };
    case "COMPLETED":
      return { label: "Completed", tone: "neutral", live: false };
    case "POSTPONED":
    case "CANCELLED":
    case "VENUE_CHANGED":
      return { label: STATUS_LABELS[status], tone: "red", live: false };
  }
  // Upcoming: already under way (between daily hours of a multi-day event)?
  if (item.startsAt <= now && now < effectiveEnd(item)) return { label: "Ongoing", tone: "green", live: false };
  const today = dateKey(now);
  const start = dateKey(item.startsAt);
  if (start === today) return { label: "Later today", tone: "gold", live: false };
  if (start === dateKey(new Date(now.getTime() + 86_400_000))) return { label: "Tomorrow", tone: "gold", live: false };
  return { label: "Coming up", tone: "neutral", live: false };
}
