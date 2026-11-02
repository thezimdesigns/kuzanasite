import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

/** Site setting: "1" shows the public feedback section, anything else hides it. */
export const FEEDBACK_PUBLIC_KEY = "feedback.public";

export const isFeedbackWallOn = cache(async () => {
  const row = await db.siteSetting.findUnique({ where: { key: FEEDBACK_PUBLIC_KEY } }).catch(() => null);
  return row?.value === "1";
});

/** "Clemence Matawu" becomes "Clemence M."; anonymous or nameless feedback shows as a visitor. */
export function defaultPublicName(f: { name: string | null; anonymous: boolean }) {
  if (f.anonymous || !f.name?.trim()) return "A visitor";
  const [first, ...rest] = f.name.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

export type PublicFeedback = { id: string; text: string; name: string; rating: number | null; context: string | null; date: Date };

/** Feedback staff chose to show publicly, newest first, or nothing when the section is switched off. */
export const getFeedbackWall = cache(async (take = 12): Promise<PublicFeedback[]> => {
  if (!(await isFeedbackWallOn())) return [];
  const rows = await db.feedback.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    take,
    include: { event: { select: { title: true } } },
  });
  return rows.map((f) => ({
    id: f.id,
    text: (f.publicText ?? f.message).trim(),
    name: f.publicName?.trim() || defaultPublicName(f),
    rating: f.rating,
    context: f.event?.title ?? null,
    date: f.createdAt,
  }));
});
