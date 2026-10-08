import { z } from "zod";

/** One block of figures, e.g. "Exhibitors" with Sport / Arts / Generic. */
export const statGroupSchema = z.object({
  title: z.string().trim().min(1, "Give each group a title.").max(60),
  /** Context for the figures, e.g. "Creative Economy Conference, Hall 2". */
  note: z.string().trim().max(120).optional(),
  showTotal: z.boolean(),
  items: z
    .array(
      z.object({
        label: z.string().trim().min(1, "Give each figure a label.").max(60),
        value: z.number().int().min(0).max(100_000_000),
      }),
    )
    .min(1, "Each group needs at least one figure.")
    .max(20),
});

export const statGroupsSchema = z.array(statGroupSchema).min(1, "Add at least one group.").max(12);

export type StatGroup = z.infer<typeof statGroupSchema>;

/** Groups from the database, tolerating anything malformed. */
export function readGroups(json: unknown): StatGroup[] {
  const parsed = statGroupsSchema.safeParse(json);
  return parsed.success ? parsed.data : [];
}

export const groupTotal = (g: StatGroup) => g.items.reduce((n, i) => n + i.value, 0);

/** The report's day (stored as a calendar date) as YYYY-MM-DD. */
export const reportKey = (day: Date) => day.toISOString().slice(0, 10);

/** A YYYY-MM-DD key as the Date stored in a @db.Date column. */
export const keyToReportDay = (key: string) => new Date(`${key}T00:00:00Z`);

export const formatNumber = (n: number) => n.toLocaleString("en-GB");

/** Change from a previous value; null when there is nothing to compare with. */
export type Change = { diff: number; pct: number | null } | null;

export function changeFrom(current: number, previous: number | undefined): Change {
  if (previous === undefined) return null;
  return { diff: current - previous, pct: previous > 0 ? Math.round(((current - previous) / previous) * 100) : null };
}

/** Looks up the same figure (group title + item label) in another day's groups. */
export function findValue(groups: StatGroup[] | undefined, title: string, label?: string) {
  const g = groups?.find((x) => x.title.trim().toLowerCase() === title.trim().toLowerCase());
  if (!g) return undefined;
  if (label === undefined) return groupTotal(g);
  return g.items.find((i) => i.label.trim().toLowerCase() === label.trim().toLowerCase())?.value;
}

/**
 * A one-line reading of a group without a total, comparing its last figure
 * with its first, e.g. "Afternoon session was 24% of Morning session."
 */
export function groupInsight(g: StatGroup) {
  if (g.showTotal || g.items.length < 2) return null;
  const first = g.items[0];
  const last = g.items[g.items.length - 1];
  if (!first.value) return null;
  return `${last.label} was ${Math.round((last.value / first.value) * 100)}% of ${first.label.toLowerCase()}.`;
}
