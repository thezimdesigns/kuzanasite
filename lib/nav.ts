/** Site navigation, shared by the header, the mega menu and the mobile drawer. */
export type NavLink = { href: string; label: string; hint?: string };
export type NavGroup = { title: string; links: NavLink[] };

/** Always visible in the desktop bar. */
export const PRIMARY_NAV: NavLink[] = [
  { href: "/live", label: "Live" },
  { href: "/programme", label: "Programme" },
  { href: "/exhibitors", label: "Exhibitors" },
  { href: "/news", label: "News" },
];

/** Big tiles at the top of the mobile menu: what people need on the day. */
export const QUICK_NAV: NavLink[] = [
  { href: "/live", label: "Live now" },
  { href: "/programme/today", label: "Today" },
  { href: "/map", label: "Venue map" },
  { href: "/exhibitors", label: "Exhibitors" },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "At the event",
    links: [
      {
        href: "/programme/today",
        label: "Today's programme",
        hint: "Times and venues for today",
      },
      {
        href: "/map",
        label: "Venue map",
        hint: "Every venue, with directions",
      },
      {
        href: "/floor-plan",
        label: "Exhibition floor plan",
        hint: "Find a stand in the halls",
      },
      {
        href: "/plan-your-visit",
        label: "Plan your visit",
        hint: "Tickets, parking, getting there",
      },
      {
        href: "/feedback",
        label: "Feedback",
        hint: "Questions, lost and found",
      },
    ],
  },
  {
    title: "Programme",
    links: [
      { href: "/programme", label: "Full programme", hint: "All five days" },
      { href: "/events", label: "Events", hint: "Exhibitions, sport, music" },
      {
        href: "/conferences",
        label: "Conferences",
        hint: "Agendas and sessions",
      },
      { href: "/speakers", label: "Speakers", hint: "Who is taking part" },
      {
        href: "/venues",
        label: "Venues",
        hint: "ZITF, Gifford, Barbourfields",
      },
    ],
  },
  {
    title: "Media",
    links: [
      { href: "/news", label: "News", hint: "Stories and updates" },
      { href: "/stats", label: "In numbers", hint: "Daily figures" },
      {
        href: "/gallery",
        label: "Photo gallery",
        hint: "Albums from the week",
      },
      { href: "/videos", label: "Videos", hint: "Highlights and sessions" },
      {
        href: "/media/coverage",
        label: "In the media",
        hint: "What others are saying",
      },
      {
        href: "/media",
        label: "Media centre",
        hint: "Press releases and kits",
      },
    ],
  },
  {
    title: "About",
    links: [
      {
        href: "/partners",
        label: "Partners & sponsors",
        hint: "Convenor, hosts, sponsors",
      },
      {
        href: "/credits",
        label: "Service providers",
        hint: "The teams behind KUZANA",
      },
      { href: "/archive", label: "Archive", hint: "Past editions" },
      {
        href: "/register",
        label: "Register as a visitor",
        hint: "Get alerts for your events",
      },
    ],
  },
];

export const isActivePath = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

export type NavPhase = "live" | "between";
/** Years the between-editions menus mention: the edition people are invited to and the last one held. */
export type NavYears = { next: number | null; past: number | null };

/** The menus between editions: stories and taking part first, the last edition as the record. */
function betweenNav({ next, past }: NavYears) {
  const review: NavLink = past
    ? { href: `/archive/${past}`, label: `${past} review`, hint: `KUZANA SCEEZ ${past} in review` }
    : { href: "/archive", label: "Archive", hint: "Past editions" };
  const takePart: NavLink = {
    href: "/take-part",
    label: "Take part",
    hint: next ? `Exhibit, sponsor, speak or perform in ${next}` : "Exhibit, sponsor, speak or perform",
  };
  return {
    primary: [
      { href: "/stories", label: "Stories" },
      { href: "/take-part", label: "Take part" },
      { href: "/exhibitors", label: "Exhibitors" },
      { href: "/news", label: "News" },
    ],
    quick: [
      { href: "/stories", label: "Stories" },
      { href: "/take-part", label: "Take part" },
      { ...review, label: past ? `KUZANA ${past}` : "Archive" },
      { href: "/exhibitors", label: "Exhibitors" },
    ],
    tabs: [
      { href: "/", label: "Home" },
      { href: "/stories", label: "Stories" },
      { href: "/exhibitors", label: "Exhibitors" },
      { ...review, label: past ? String(past) : "Archive" },
      { href: "/take-part", label: "Take part" },
    ],
    groups: [
      {
        title: "Stories & updates",
        links: [
          { href: "/stories", label: "Stories & series", hint: "Participants, interviews, Signal" },
          { href: "/stories/share", label: "Share your story", hint: "Took part? Tell us what happened next" },
          { href: "/news", label: "News", hint: "Updates and announcements" },
          { href: "/media/coverage", label: "In the media", hint: "What others are saying" },
          { href: "/media", label: "Media centre", hint: "Speeches, press releases and kits" },
        ],
      },
      {
        title: next ? `Take part in ${next}` : "Take part",
        links: [
          takePart,
          { href: "/portal", label: "Exhibitor & sponsor portal", hint: "Apply, or log in to your application" },
          { href: "/register", label: "Get updates", hint: "By email or WhatsApp" },
          { href: "/save-the-date.ics", label: "Save the date", hint: "Add it to your calendar" },
        ],
      },
      {
        title: past ? `KUZANA ${past}` : "Past editions",
        links: [
          review,
          { href: "/programme", label: "Programme", hint: "Every event of the week" },
          { href: "/speakers", label: "Speakers", hint: "Who took part" },
          { href: "/stats", label: "In numbers", hint: "Daily figures" },
          { href: "/gallery", label: "Photo gallery", hint: "Albums from the week" },
          { href: "/videos", label: "Videos", hint: "Highlights and sessions" },
        ],
      },
      {
        title: "About",
        links: [
          { href: "/partners", label: "Partners & sponsors", hint: "Convenor, hosts, sponsors" },
          { href: "/credits", label: "Service providers", hint: "The teams behind KUZANA" },
          { href: "/archive", label: "Archive", hint: "Every edition" },
          { href: "/feedback", label: "Feedback", hint: "Tell the organisers" },
        ],
      },
    ] as NavGroup[],
  };
}

/** Every menu link once (by address), in menu order, for the admin's on/off switches. */
export function allNavLinks(years: NavYears = { next: null, past: null }) {
  const seen = new Map<string, { href: string; label: string; places: string[] }>();
  const add = (l: NavLink, place: string) => {
    const row = seen.get(l.href) ?? { href: l.href, label: l.label, places: [] };
    if (!row.places.includes(place)) row.places.push(place);
    seen.set(l.href, row);
  };
  PRIMARY_NAV.forEach((l) => add(l, "Top bar"));
  QUICK_NAV.forEach((l) => add(l, "Phone menu tiles"));
  MOBILE_TABS.forEach((l) => add(l, "Phone bottom bar"));
  NAV_GROUPS.forEach((g) => g.links.forEach((l) => add(l, `Explore: ${g.title}`)));
  const between = betweenNav(years);
  between.primary.forEach((l) => add(l, "Top bar (between editions)"));
  between.quick.forEach((l) => add(l, "Phone menu tiles (between editions)"));
  between.tabs.forEach((l) => add(l, "Phone bottom bar (between editions)"));
  between.groups.forEach((g) => g.links.forEach((l) => add(l, `Explore (between editions): ${g.title}`)));
  return [...seen.values()];
}

/** Shortcuts in the bar fixed to the bottom of phone screens. */
export const MOBILE_TABS: NavLink[] = [
  { href: "/live", label: "Live" },
  { href: "/programme/today", label: "Today" },
  { href: "/exhibitors", label: "Exhibitors" },
  { href: "/gallery", label: "Gallery" },
  { href: "/feedback", label: "Feedback" },
];

/** The menus with the links an admin has switched off taken out (empty groups too). */
export function visibleNav(hidden: readonly string[], phase: NavPhase = "live", years: NavYears = { next: null, past: null }) {
  const show = (l: NavLink) => !hidden.includes(l.href);
  const set = phase === "between" ? betweenNav(years) : { primary: PRIMARY_NAV, quick: QUICK_NAV, tabs: MOBILE_TABS, groups: NAV_GROUPS };
  return {
    primary: set.primary.filter(show),
    quick: set.quick.filter(show),
    tabs: set.tabs.filter(show),
    groups: set.groups.map((g) => ({ ...g, links: g.links.filter(show) })).filter((g) => g.links.length > 0),
  };
}
