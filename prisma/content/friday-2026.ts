/**
 * Friday 9 October 2026 programmes (official programme document):
 *   Official Opening of KUZANA SCEEZ 2026, keynote by the President
 *   Sport and Arts Tourism Reception
 * Applied once by the seed (guarded by a SiteSetting flag). Later CMS edits are kept.
 */
import type { ParticipantRole, PrismaClient, SessionType } from "../../lib/generated/prisma/client";

const FLAG = "content.friday-2026-10-09.v1";
const DAY = "2026-10-09";
const at = (time: string) => new Date(`${DAY}T${time}+02:00`);

type P = { name: string; jobTitle?: string; organisation?: string };
type Role = [P, ParticipantRole];
type Row = { time: string; end: string; title: string; type: SessionType; description?: string; people?: Role[] };

const SANYATWE: P = { name: "Hon. Lt. Gen. (Rtd) Ambassador A. N. Sanyatwe", jobTitle: "Minister of Sport, Recreation, Arts and Culture" };
const NCUBE: P = { name: "Hon. J. M. Ncube", jobTitle: "Minister of State for Provincial Affairs and Devolution, Bulawayo Metropolitan Province" };
const MOYO: P = { name: "Mr N. Moyo", jobTitle: "Secretary for Sport, Recreation, Arts and Culture" };
const PRESIDENT: P = { name: "H.E. Dr E. D. Mnangagwa", jobTitle: "President of the Republic of Zimbabwe" };
const COLTART: P = { name: "His Worship Councillor D. Coltart", jobTitle: "Mayor", organisation: "City of Bulawayo" };
const CHIDHAKWA: P = { name: "Dr E. Chidhakwa", jobTitle: "Chief Director for Sport, Recreation, Arts and Culture" };
const RWODZI: P = { name: "Hon. B. Rwodzi", jobTitle: "Minister of Tourism and Hospitality Industry" };

const OPENING: Row[] = [
  { time: "07:00", end: "09:30", title: "Arrival of Invited Guests", type: "REGISTRATION" },
  { time: "09:30", end: "09:45", title: "Arrival of the Guest of Honour", type: "OPENING_CEREMONY" },
  { time: "09:45", end: "10:15", title: "Briefing of the Guest of Honour", type: "OPENING_CEREMONY", people: [[SANYATWE, "FACILITATOR"]] },
  { time: "10:15", end: "11:10", title: "Tour of Exhibition Stands by the Guest of Honour", type: "NETWORKING", people: [[SANYATWE, "FACILITATOR"]] },
  { time: "11:10", end: "11:15", title: "Entrance Artistic and Cultural Performance: Praise Poetry", type: "CULTURAL_PERFORMANCE" },
  { time: "11:15", end: "11:25", title: "National Anthem", type: "OPENING_CEREMONY" },
  { time: "11:25", end: "11:30", title: "Prayer", type: "OPENING_CEREMONY" },
  {
    time: "11:30",
    end: "11:40",
    title: "Welcome Remarks",
    type: "OPENING_CEREMONY",
    description: "By the Minister of State for Provincial Affairs and Devolution for Bulawayo Metropolitan Province.",
    people: [[NCUBE, "SPEAKER"]],
  },
  { time: "11:40", end: "11:50", title: "Artistic and Cultural Performance", type: "CULTURAL_PERFORMANCE" },
  {
    time: "11:50",
    end: "12:10",
    title: "Remarks and Introduction of the Guest of Honour",
    type: "OPENING_CEREMONY",
    description: "By the Minister of Sport, Recreation, Arts and Culture.",
    people: [[SANYATWE, "SPEAKER"]],
  },
  {
    time: "12:10",
    end: "12:50",
    title: "Official Keynote Address by the President of the Republic of Zimbabwe",
    type: "KEYNOTE",
    description: "His Excellency, Dr E. D. Mnangagwa officially opens KUZANA SCEEZ 2026.",
    people: [
      [PRESIDENT, "GUEST_OF_HONOUR"],
      [SANYATWE, "FACILITATOR"],
    ],
  },
  { time: "12:50", end: "13:00", title: "Artistic and Cultural Performance", type: "CULTURAL_PERFORMANCE" },
  {
    time: "13:00",
    end: "13:05",
    title: "Presentation of Gifts to the Guest of Honour",
    type: "OPENING_CEREMONY",
    description: "By the Minister of Sport, Recreation, Arts and Culture.",
    people: [[SANYATWE, "SPEAKER"]],
  },
  {
    time: "13:05",
    end: "13:15",
    title: "Vote of Thanks",
    type: "OPENING_CEREMONY",
    description: "By the Mayor of the City of Bulawayo.",
    people: [[COLTART, "SPEAKER"]],
  },
  { time: "13:15", end: "13:45", title: "Entertainment and End of Official Proceedings", type: "CLOSING_SESSION" },
];

const RECEPTION: Row[] = [
  { time: "15:30", end: "15:50", title: "Arrival of Invited Guests", type: "REGISTRATION" },
  { time: "15:50", end: "16:00", title: "Arrival of the Guest of Honour", type: "OPENING_CEREMONY" },
  { time: "16:00", end: "16:05", title: "Introductions", type: "OPENING_CEREMONY" },
  { time: "16:05", end: "16:15", title: "Cultural and Artistic Performance", type: "CULTURAL_PERFORMANCE" },
  { time: "16:15", end: "16:25", title: "Keynote Address", type: "KEYNOTE", description: "By the Minister of Tourism and Hospitality Industry.", people: [[RWODZI, "SPEAKER"]] },
  {
    time: "16:25",
    end: "16:35",
    title: "Remarks by the Guest of Honour",
    type: "OPENING_CEREMONY",
    description: "By the Minister of Sport, Recreation, Arts and Culture.",
    people: [
      [SANYATWE, "GUEST_OF_HONOUR"],
      [MOYO, "FACILITATOR"],
    ],
  },
  { time: "16:35", end: "16:40", title: "Reception Toast", type: "NETWORKING" },
  {
    time: "16:40",
    end: "16:45",
    title: "Vote of Thanks",
    type: "CLOSING_SESSION",
    description: "By the Secretary for Sport, Recreation, Arts and Culture.",
    people: [[MOYO, "SPEAKER"]],
  },
  {
    time: "16:45",
    end: "18:00",
    title: "Networking, Refreshments and Finger Foods",
    type: "NETWORKING",
    description: "Accompanied by a cultural and artistic performance.",
  },
  { time: "18:00", end: "18:10", title: "Close of Programme and Departure", type: "CLOSING_SESSION" },
];

const THEME = "Kuzana: Towards Vision 2030 through Sport and Creative Industries";

const EVENTS = [
  {
    slug: "official-opening",
    title: "Official Opening of KUZANA SCEEZ 2026",
    summary: "The official opening of the Sport and Creative Economy Expo of Zimbabwe, with a keynote address by His Excellency the President, Dr E. D. Mnangagwa.",
    description: `**Theme:** ${THEME}\n\n**Venue:** Zimbabwe International Trade Fair, Hall 2\n\n**Programme starts:** 09:00 (guests arrive from 07:00)\n\n**Director of Ceremonies:** ${MOYO.name}, ${MOYO.jobTitle}`,
    start: "07:00",
    end: "13:45",
    featured: true,
    sortOrder: 3,
    rows: OPENING,
    people: [
      [PRESIDENT, "GUEST_OF_HONOUR"],
      [SANYATWE, "SPEAKER"],
      [MOYO, "FACILITATOR"],
    ] as Role[],
  },
  {
    slug: "sport-and-arts-tourism-reception",
    title: "Sport and Arts Tourism Reception",
    summary: "An evening reception on sport and arts tourism, with a keynote by the Minister of Tourism and Hospitality Industry, Hon. B. Rwodzi.",
    description: `**Venue:** Zimbabwe International Trade Fair, Hall 2\n\n**Director of Ceremonies:** ${CHIDHAKWA.name}, ${CHIDHAKWA.jobTitle}`,
    start: "15:30",
    end: "18:10",
    featured: false,
    sortOrder: 4,
    rows: RECEPTION,
    people: [
      [SANYATWE, "GUEST_OF_HONOUR"],
      [RWODZI, "SPEAKER"],
      [CHIDHAKWA, "FACILITATOR"],
    ] as Role[],
  },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/\(rtd\.?\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function applyFridayProgrammes(db: PrismaClient) {
  if (await db.siteSetting.findUnique({ where: { key: FLAG } })) return;
  const edition = (await db.edition.findFirst({ where: { isCurrent: true } })) ?? (await db.edition.findFirst({ where: { year: 2026 } }));
  const venue = await db.venue.findFirst({ where: { slug: "zitf" } });
  if (!edition) return;
  const category =
    (await db.eventCategory.findUnique({ where: { slug: "ceremony" } })) ??
    (await db.eventCategory.create({ data: { name: "Official ceremony", slug: "ceremony", sortOrder: 0 } }));

  const people = new Map<string, string>();
  async function personId(p: P) {
    const slug = slugify(p.name);
    const cached = people.get(slug);
    if (cached) return cached;
    const row = await db.person.upsert({
      where: { slug },
      update: {},
      create: { slug, name: p.name, jobTitle: p.jobTitle ?? null, organisation: p.organisation ?? null },
    });
    people.set(slug, row.id);
    return row.id;
  }

  for (const e of EVENTS) {
    if (await db.event.findUnique({ where: { slug: e.slug } })) continue;
    const event = await db.event.create({
      data: {
        editionId: edition.id,
        slug: e.slug,
        title: e.title,
        summary: e.summary,
        description: e.description,
        startsAt: at(e.start),
        endsAt: at(e.end),
        venueId: venue?.id ?? null,
        room: "Hall 2",
        categoryId: category.id,
        featured: e.featured,
        sortOrder: e.sortOrder,
        publishStatus: "PUBLISHED",
      },
    });
    for (const [i, r] of e.rows.entries()) {
      const session = await db.session.create({
        data: {
          eventId: event.id,
          title: r.title,
          type: r.type,
          description: r.description ?? null,
          startsAt: at(r.time),
          endsAt: at(r.end),
          room: "Hall 2",
          sortOrder: i,
          publishStatus: "PUBLISHED",
        },
      });
      for (const [j, [p, role]] of (r.people ?? []).entries()) {
        await db.sessionParticipant.create({ data: { sessionId: session.id, personId: await personId(p), role, sortOrder: j } });
      }
    }
    for (const [j, [p, role]] of e.people.entries()) {
      await db.eventParticipant.create({ data: { eventId: event.id, personId: await personId(p), role, sortOrder: j } });
    }
  }

  await db.siteSetting.create({ data: { key: FLAG, value: new Date().toISOString() } });
}
