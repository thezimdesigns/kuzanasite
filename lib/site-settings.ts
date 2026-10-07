import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { MEDIA_SECTIONS } from "@/lib/options";
import { DEFAULT_FOOTER_LINKS } from "@/lib/footer-defaults";
import { CONTACT_EMAIL, SOCIAL_LINKS } from "@/lib/site";

export { DEFAULT_FOOTER_LINKS };

/** Editable footer settings and their defaults (used until an admin saves a value). */
export const FOOTER_SETTING_DEFAULTS = {
  "footer.tagline": "Sport & Creative Economy Expo of Zimbabwe. #FromTalentToGDP",
  "footer.location": "Bulawayo, Zimbabwe",
  "footer.email": CONTACT_EMAIL,
  "footer.phone": "",
  "footer.facebook": SOCIAL_LINKS.facebook,
  "footer.instagram": "",
  "footer.linkedin": "",
  "footer.youtube": "",
  "footer.x": "",
  "footer.col1Title": "At the event",
  "footer.col2Title": "Media & more",
} as const;

export type FooterSettingKey = keyof typeof FOOTER_SETTING_DEFAULTS;
export type FooterSettings = Record<FooterSettingKey, string>;

export const getFooter = cache(async () => {
  const [rows, links] = await Promise.all([
    db.siteSetting.findMany({ where: { key: { startsWith: "footer." } } }),
    db.footerLink.findMany({ orderBy: [{ column: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }] }),
  ]);
  const settings = { ...FOOTER_SETTING_DEFAULTS } as FooterSettings;
  for (const r of rows) if (r.key in settings) settings[r.key as FooterSettingKey] = r.value;
  const list = links.length ? links : DEFAULT_FOOTER_LINKS.map((l, i) => ({ ...l, id: `default-${i}`, newTab: false, sortOrder: i }));
  return {
    settings,
    columns: [1, 2].map((c) => list.filter((l) => l.column === c)),
  };
});

/** Pages on the site that a footer link can point to, grouped for a picker. */
export async function internalLinkOptions() {
  const [pages, events, venues] = await Promise.all([
    db.page.findMany({ orderBy: { title: "asc" }, select: { slug: true, title: true } }),
    db.event.findMany({ where: { publishStatus: "PUBLISHED" }, orderBy: { startsAt: "asc" }, select: { slug: true, title: true } }),
    db.venue.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
  ]);
  return [
    {
      group: "Main pages",
      options: [
        ["/", "Home"],
        ["/live", "KUZANA Live"],
        ["/programme", "Programme"],
        ["/programme/today", "Today's programme"],
        ["/events", "Events"],
        ["/conferences", "Conferences"],
        ["/exhibitors", "Exhibitors"],
        ["/speakers", "Speakers"],
        ["/venues", "Venues"],
        ["/gallery", "Photo gallery"],
        ["/videos", "Videos"],
        ["/media", "Media centre"],
        ["/feedback", "Feedback"],
        ["/register", "Visitor registration"],
        ["/partners", "Partners"],
        ["/archive", "Archive"],
        ["/search", "Search"],
      ].map(([href, label]) => ({ href, label })),
    },
    { group: "Content pages", options: pages.map((p) => ({ href: `/${p.slug}`, label: p.title })) },
    {
      group: "Media centre sections",
      options: Object.entries(MEDIA_SECTIONS).map(([slug, s]) => ({ href: `/media/${slug}`, label: s.title })),
    },
    { group: "Events", options: events.map((e) => ({ href: `/events/${e.slug}`, label: e.title })) },
    { group: "Venues", options: venues.map((v) => ({ href: `/venues/${v.slug}`, label: v.name })) },
  ].filter((g) => g.options.length);
}
