import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { computeStatus, dateKey, occursOn } from "@/lib/time";

const AUTO_APPROVE_KEY = "qa.autoApprove";
const VOTER_COOKIE = "kz_voter";
export const ASKABLE: string[] = ["KEYNOTE", "PANEL_DISCUSSION", "PRESENTATION", "WORKSHOP", "CLOSING_SESSION"];

/** When on, questions show publicly as soon as they are sent (moderators can still hide them). */
export async function qaAutoApprove() {
  const row = await db.siteSetting.findUnique({ where: { key: AUTO_APPROVE_KEY } });
  return row?.value === "true";
}

export async function setQaAutoApprove(on: boolean) {
  await db.siteSetting.upsert({ where: { key: AUTO_APPROVE_KEY }, update: { value: String(on) }, create: { key: AUTO_APPROVE_KEY, value: String(on) } });
}

/** A stable, anonymous id for this browser (hashed before it is stored), so each phone votes once. */
export async function voterId(create: boolean) {
  const jar = await cookies();
  let raw = jar.get(VOTER_COOKIE)?.value;
  if (!raw && create) {
    raw = randomUUID();
    jar.set(VOTER_COOKIE, raw, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  }
  return raw ? createHash("sha256").update(`qa:${raw}`).digest("hex") : null;
}

/** A conference with its published sessions, and the session most likely being asked about now. */
export async function getQaConference(slug: string, now = new Date()) {
  const event = await db.event.findFirst({
    where: { slug, publishStatus: { in: ["PUBLISHED", "ARCHIVED"] } },
    include: {
      sessions: {
        where: { publishStatus: "PUBLISHED" },
        orderBy: [{ startsAt: "asc" }, { sortOrder: "asc" }],
        select: { id: true, title: true, startsAt: true, endsAt: true, statusOverride: true, type: true },
      },
    },
  });
  if (!event) return null;
  // Only talks and panels take questions; ceremony items (anthem, lunch, photos) do not.
  const askable = event.sessions.filter((s) => ASKABLE.includes(s.type));
  const withStatus = askable.map((s) => ({ ...s, status: computeStatus(s, now) }));
  const lastDone = [...withStatus].reverse().find((s) => s.status === "COMPLETED");
  const justEnded = lastDone?.endsAt && now.getTime() - lastDone.endsAt.getTime() < 20 * 60_000;
  const current =
    withStatus.find((s) => s.status === "LIVE") ??
    // During the Q&A slot after a panel, questions are still for that panel…
    (justEnded ? lastDone : undefined) ??
    // …otherwise for whatever comes next (e.g. over lunch), or the last one of the day.
    withStatus.find((s) => s.status === "STARTING_SOON" || s.status === "UPCOMING") ??
    lastDone;
  return { event, sessions: withStatus, currentSessionId: current?.id ?? null };
}

/**
 * The conference delegates most likely want to ask about: one on today,
 * otherwise the next one coming up, otherwise the most recent. Null if none.
 */
export async function currentQaConference(now = new Date()) {
  const conferences = await db.event.findMany({
    where: { isConference: true, publishStatus: "PUBLISHED" },
    orderBy: { startsAt: "asc" },
    select: { slug: true, title: true, startsAt: true, endsAt: true, timeTbc: true, dailyHours: true, statusOverride: true },
  });
  const today = dateKey(now);
  const onToday = conferences.find((c) => occursOn(c, today));
  const upcoming = conferences.find((c) => c.startsAt > now);
  const recent = [...conferences].reverse().find((c) => c.startsAt <= now);
  const pick = onToday ?? upcoming ?? recent;
  return pick ? { slug: pick.slug, title: pick.title, isSoon: !!(onToday ?? upcoming) } : null;
}
