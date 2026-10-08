import { z } from "zod";

/** One block of figures, e.g. "Exhibitors" with Sport / Arts / Generic. */
export const statGroupSchema = z.object({
  title: z.string().trim().min(1, "Give each group a title.").max(60),
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
