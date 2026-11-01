import "server-only";
import { db } from "@/lib/db";
import type { NewsOptions } from "@/components/admin/news-form";

/** Choices for the story editor: events, series, and who a story can feature. */
export async function newsOptions(): Promise<NewsOptions> {
  const [events, series, exhibitors, people] = await Promise.all([
    db.event.findMany({ orderBy: { startsAt: "asc" }, select: { id: true, title: true } }),
    db.series.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }], select: { id: true, title: true } }),
    db.exhibitor.findMany({ where: { status: "APPROVED" }, orderBy: { name: "asc" }, select: { id: true, name: true, edition: { select: { year: true } } } }),
    db.person.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, organisation: true } }),
  ]);
  return {
    events,
    series,
    exhibitors: exhibitors.map((x) => ({ id: x.id, label: `${x.name} (${x.edition.year})` })),
    people: people.map((p) => ({ id: p.id, label: p.organisation ? `${p.name}, ${p.organisation}` : p.name })),
  };
}
