import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getStaff } from "@/lib/permissions";
import { dateKey } from "@/lib/time";

export const getCurrentEdition = cache(async () => {
  return (await db.edition.findFirst({ where: { isCurrent: true } })) ?? (await db.edition.findFirst({ orderBy: { year: "desc" } }));
});

export async function requireCurrentEdition() {
  const edition = await getCurrentEdition();
  if (!edition) throw new Error("No edition configured. Run the seed script.");
  return edition;
}

export type SitePhase = "live" | "between";
export const PHASE_PREVIEW_COOKIE = "kz_phase";

type EditionLike = { year: number; name: string; theme: string | null; startDate: Date; endDate: Date };

/**
 * Where KUZANA is in its yearly cycle.
 * - live: today falls within the current edition's dates (event week).
 * - between: any other time. The site leads with ongoing stories and the next
 *   edition, and keeps the last finished edition as the record.
 * `current` is the edition people are invited to; `past` is the latest one that has ended.
 * Signed-in staff can preview either phase with the kz_phase cookie (set from Admin › Editions).
 */
export const getSiteState = cache(async (now = new Date()) => {
  const editions = await db.edition.findMany({ orderBy: { year: "desc" } });
  const current = editions.find((e) => e.isCurrent) ?? editions[0] ?? null;
  const today = dateKey(now);
  const past = editions.find((e) => dateKey(e.endDate) < today) ?? null;
  let phase: SitePhase = current && today >= dateKey(current.startDate) && today <= dateKey(current.endDate) ? "live" : "between";

  const preview = (await cookies()).get(PHASE_PREVIEW_COOKIE)?.value;
  if ((preview === "live" || preview === "between") && preview !== phase && (await getStaff())) phase = preview;

  // The edition visitors are invited to: the current one unless it has already ended.
  const next = current && dateKey(current.endDate) >= today ? current : null;
  return { phase, current, past, next, previewing: preview === phase && !!preview };
});

/** "6–10 October 2027" (or "30 September – 4 October 2027" across months). */
export function editionDates(e: Pick<EditionLike, "startDate" | "endDate">) {
  const parts = (d: Date) => Object.fromEntries(longParts.formatToParts(d).map((p) => [p.type, p.value]));
  const a = parts(e.startDate);
  const b = parts(e.endDate);
  if (a.year !== b.year) return `${a.day} ${a.month} ${a.year} – ${b.day} ${b.month} ${b.year}`;
  if (a.month !== b.month) return `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
  return `${a.day}–${b.day} ${b.month} ${b.year}`;
}
const longParts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Harare", day: "numeric", month: "long", year: "numeric" });

/** The edition whose programme the site shows: the current one once it has events, else the last finished one. */
export const getProgrammeEdition = cache(async () => {
  const { current, past } = await getSiteState();
  if (current && (await db.event.count({ where: { editionId: current.id, publishStatus: "PUBLISHED" } }))) return current;
  return past ?? current;
});

// ---------------------------------------------------------------------------
// Exhibitor and sponsor portal (portal.kuzana.org.zw): applications live there.
// ---------------------------------------------------------------------------

export const PORTAL_KEYS = { url: "portal.url", open: "portal.open" } as const;
export const PORTAL_DEFAULT_URL = "https://portal.kuzana.org.zw";

export const getPortal = cache(async () => {
  const rows = await db.siteSetting.findMany({ where: { key: { in: Object.values(PORTAL_KEYS) } } }).catch(() => []);
  const get = (k: string) => rows.find((r) => r.key === k)?.value;
  return { url: get(PORTAL_KEYS.url) || PORTAL_DEFAULT_URL, open: get(PORTAL_KEYS.open) === "1" };
});

/** schema.org Event for an edition, so search engines can show the dates. */
export function editionJsonLd(e: EditionLike, url: string) {
  const day = (d: Date) => dateKey(d);
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.name,
    description: e.theme ?? "Sport & Creative Economy Expo of Zimbabwe",
    startDate: day(e.startDate),
    endDate: day(e.endDate),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: "Bulawayo", address: { "@type": "PostalAddress", addressLocality: "Bulawayo", addressCountry: "ZW" } },
    organizer: { "@type": "Organization", name: "KUZANA SCEEZ", url },
    url,
  };
}
