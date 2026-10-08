import type { StatGroup } from "@/lib/stats";

type Activity = { slug: string; title: string; category?: string | null; isConference?: boolean };

const items = (...labels: string[]) => labels.map((label) => ({ label, value: 0 }));

/**
 * Ready-made figure groups for a programme activity, so a day's figures for
 * the exhibition, a conference, the boxing, the football, the marathon or the
 * music show can be added in one click. Titles stay the same every day so the
 * site can compare days ("Exhibitors" on Day 2 vs Day 1).
 */
export function templatesFor(a: Activity): StatGroup[] {
  const text = `${a.category ?? ""} ${a.title}`.toLowerCase();
  const link = { eventSlug: a.slug, note: a.title };
  if (a.isConference || text.includes("conference")) {
    return [{ title: "Conference delegates", showTotal: false, ...link, items: items("Morning session", "Afternoon session") }];
  }
  if (text.includes("exhibition") || text.includes("expo")) {
    return [
      { title: "Exhibitors", showTotal: true, ...link, items: items("Sport", "Arts", "Generic") },
      { title: "Exhibition visitors", showTotal: false, ...link, items: items("Visitors") },
    ];
  }
  if (text.includes("marathon") || text.includes("race") || text.includes(" run")) {
    return [
      { title: "Marathon runners", showTotal: true, ...link, items: items("5 km", "10 km", "21.1 km", "42.2 km") },
      { title: "Marathon finishers", showTotal: true, ...link, items: items("5 km", "10 km", "21.1 km", "42.2 km") },
    ];
  }
  if (text.includes("boxing")) {
    return [{ title: "Boxing match", showTotal: false, ...link, items: items("Spectators", "Bouts") }];
  }
  if (text.includes("football") || text.includes("soccer") || text.includes(" vs ")) {
    return [{ title: "Football match", showTotal: false, ...link, items: items("Spectators") }];
  }
  if (text.includes("music") || text.includes("festival") || text.includes("concert") || text.includes("show")) {
    return [{ title: "Music festival", showTotal: false, ...link, items: items("Audience", "Artists performing") }];
  }
  return [{ title: a.title, showTotal: false, ...link, items: items("Attendance") }];
}
