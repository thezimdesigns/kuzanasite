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
