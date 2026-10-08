import "server-only";
import { db } from "@/lib/db";
import { getCurrentEdition } from "@/lib/edition";
import { readGroups, reportKey } from "@/lib/stats";
import { dateKey, formatDay, formatLongDay, startOfDay } from "@/lib/time";

export type PublishedReport = Awaited<ReturnType<typeof getPublishedReports>>[number];

/** Published daily figures, newest first, with "Day 2 · Thursday 8 October 2026" labels. */
export async function getPublishedReports(take?: number) {
  const [rows, edition] = await Promise.all([
    db.dailyReport.findMany({ where: { publishStatus: "PUBLISHED" }, orderBy: { day: "desc" }, take }),
    getCurrentEdition(),
  ]);
  const first = edition ? startOfDay(dateKey(edition.startDate)).getTime() : null;
  return rows.map((r) => {
    const key = reportKey(r.day);
    const day = startOfDay(key);
    const n = first != null ? Math.round((day.getTime() - first) / 86_400_000) + 1 : 0;
    return {
      id: r.id,
      key,
      headline: r.headline,
      note: r.note,
      groups: readGroups(r.groups),
      date: formatLongDay(day),
      short: formatDay(day),
      dayNumber: n >= 1 && n <= 31 ? n : null,
    };
  });
}
