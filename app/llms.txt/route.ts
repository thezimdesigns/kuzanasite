import { db } from "@/lib/db";
import { getCurrentEdition } from "@/lib/edition";
import { getEditionEvents } from "@/lib/programme";
import { siteUrl } from "@/lib/site";
import { getPublishedReports } from "@/lib/stats-server";
import { formatNumber, groupTotal } from "@/lib/stats";
import { formatDate, formatRange } from "@/lib/time";

export const dynamic = "force-dynamic";

/**
 * /llms.txt: a plain-language guide to the site for AI assistants and
 * AI search (see llmstxt.org). Built from live data so it stays current.
 */
export async function GET() {
  const [edition, events, venues, reports, news] = await Promise.all([
    getCurrentEdition(),
    getEditionEvents(),
    db.venue.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true, address: true } }),
    getPublishedReports(),
    db.newsPost.findMany({ where: { publishStatus: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 10, select: { title: true, slug: true, publishedAt: true } }),
  ]);
  const link = (title: string, path: string, note?: string) => `- [${title}](${siteUrl(path)})${note ? `: ${note}` : ""}`;

  const lines = [
    "# KUZANA SCEEZ",
    "",
    "> KUZANA SCEEZ (Sport & Creative Economy Expo of Zimbabwe) is a national platform that brings together sport, the arts and the creative industries with investors, government and the public. " +
      (edition
        ? `${edition.name} runs ${formatDate(edition.startDate)} to ${formatDate(edition.endDate)} in Bulawayo, Zimbabwe${edition.theme ? `, under the theme "${edition.theme}"` : ""}.`
        : "It takes place in Bulawayo, Zimbabwe."),
    "",
    "It is convened by the Ministry of Sport, Recreation, Arts and Culture (MOSRAC), hosted at the Zimbabwe International Trade Fair (ZITF), with Nhimbe Trust as technical partner. Times are Central Africa Time (UTC+2).",
    "",
    "## Programme",
    link("Full programme", "/programme", "every event, day by day, with live status"),
    link("What's on now", "/live"),
    ...events.map((e) => link(e.title, `/events/${e.slug}`, [formatRange(e.startsAt, e.endsAt, e.timeTbc, e.dailyHours), e.venue?.name, e.summary].filter(Boolean).join(". "))),
    "",
    "## Venues",
    link("Venue map", "/map"),
    ...venues.map((v) => link(v.name, `/venues/${v.slug}`, v.address ?? undefined)),
    "",
    "## People and exhibitors",
    link("Speakers and panellists", "/speakers"),
    link("Exhibitor directory", "/exhibitors"),
    link("Exhibition floor plan", "/floor-plan"),
    link("Partners: convenor, host and technical partner", "/partners"),
  ];

  if (reports.length) {
    lines.push("", "## KUZANA in numbers", link("Daily figures", "/stats"));
    for (const r of reports) {
      const parts = r.groups.map((g) => (g.showTotal ? `${g.title}: ${formatNumber(groupTotal(g))}` : `${g.title}: ${g.items.map((i) => `${i.label} ${formatNumber(i.value)}`).join(", ")}`));
      lines.push(`- ${r.dayNumber ? `Day ${r.dayNumber}, ` : ""}${r.date}: ${parts.join("; ")}`);
    }
  }
  if (news.length) {
    lines.push("", "## News", link("All news", "/news"), ...news.map((n) => link(n.title, `/news/${n.slug}`, formatDate(n.publishedAt))));
  }
  lines.push(
    "",
    "## Media",
    link("Media centre: press releases, speeches, presentations", "/media"),
    link("Coverage in other media", "/media/coverage"),
    link("Photo gallery", "/gallery"),
    link("Videos", "/videos"),
    "",
    "## Visiting",
    link("Plan your visit", "/plan-your-visit"),
    link("Register as a visitor", "/register"),
    link("Feedback and contact", "/feedback"),
    "",
  );

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=900" },
  });
}
