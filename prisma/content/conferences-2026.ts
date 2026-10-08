/**
 * Official running orders of the two KUZANA SCEEZ 2026 opening conferences:
 *   Wed 7 Oct  Sport Industry Conference     (official opening programme, .docx)
 *   Thu 8 Oct  Creative Economy Conference   (official programme, .pdf)
 *
 * Applied once by the seed (guarded by a SiteSetting flag), replacing the
 * placeholder sessions. Later edits in the CMS are never overwritten.
 */
import type { ParticipantRole, PrismaClient, SessionType } from "../../lib/generated/prisma/client";

const FLAG = "content.conferences-2026.v1";
const at = (local: string) => new Date(`${local}+02:00`);

type P = { name: string; jobTitle?: string; organisation?: string };
type Role = [P, ParticipantRole];
type Row = { time: string; end?: string; title: string; type: SessionType; description?: string; people?: Role[] };

// People -----------------------------------------------------------------------
const SANYATWE: P = { name: "Hon. Lt. Gen. (Rtd) Ambassador A. N. Sanyatwe", jobTitle: "Minister of Sport, Recreation, Arts and Culture" };
const NCUBE: P = { name: "Hon. J. M. Ncube", jobTitle: "Minister of State for Provincial Affairs and Devolution, Bulawayo Metropolitan Province" };
const MOYO: P = { name: "Mr N. Moyo", jobTitle: "Secretary for Sport, Recreation, Arts and Culture" };
const CHIWENGA: P = { name: "Hon. Gen. (Rtd) Dr C. G. D. N. Chiwenga", jobTitle: "Vice President of the Republic of Zimbabwe" };
const MOHADI: P = { name: "Hon. Col. (Rtd) Dr K. C. D. Mohadi", jobTitle: "Vice President of the Republic of Zimbabwe" };
const COVENTRY: P = { name: "Dr K. Coventry", jobTitle: "President", organisation: "International Olympic Committee" };
const AL_FAYEZ: P = { name: "Mr N. H. Al-Fayez", jobTitle: "Deputy Director-General for Culture", organisation: "UNESCO" };
const MADZIVANYIKA: P = { name: "Dr N. Madzivanyika", jobTitle: "Chairman", organisation: "Sport and Recreation Commission" };
const CHEDA: P = { name: "Justice (Rtd) M. Cheda", jobTitle: "Board Chair", organisation: "National Gallery of Zimbabwe" };
const NYANHI: P = { name: "Mr N. Nyanhi", jobTitle: "Chief Executive Officer", organisation: "National Arts Council of Zimbabwe" };
const MANGUNDA: P = { name: "Yvonne Mangunda" };
const SIMBA: P = { name: "Commissioner Dave Simba" };
const EVANS: P = { name: "Mr A. Evans" };
const CHAGONDA: P = { name: "Mr S. Chagonda" };
const p = (name: string): P => ({ name });

// Shared opening items -----------------------------------------------------------
const arrival = (time: string, end: string): Row => ({ time, end, title: "Arrival of Invited Guests and Registration", type: "REGISTRATION" });
const gohArrival = (time: string, end: string): Row => ({ time, end, title: "Arrival of Guest of Honour", type: "OPENING_CEREMONY" });
const performance = (time: string, end: string): Row => ({ time, end, title: "Cultural and Artistic Performance", type: "CULTURAL_PERFORMANCE" });
const welcome = (time: string, end: string): Row => ({
  time,
  end,
  title: "Welcome Remarks",
  type: "OPENING_CEREMONY",
  description: "By the Minister of State for Provincial Affairs and Devolution for Bulawayo Metropolitan Province.",
  people: [[NCUBE, "SPEAKER"]],
});
const introduction = (time: string, end: string): Row => ({
  time,
  end,
  title: "Remarks and Introduction of the Guest of Honour",
  type: "OPENING_CEREMONY",
  description: "By the Minister of Sport, Recreation, Arts and Culture.",
  people: [[SANYATWE, "SPEAKER"]],
});
const gifts = (time: string, end: string): Row => ({
  time,
  end,
  title: "Presentation of Gifts to the Guest of Honour",
  type: "OPENING_CEREMONY",
  description: "By the Minister of Sport, Recreation, Arts and Culture.",
  people: [[SANYATWE, "SPEAKER"]],
});
const qa = (time: string, end: string): Row => ({ time, end, title: "Question and Answer Session", type: "QA" });

// Wednesday 7 October: Sport Industry Conference ---------------------------------
const SPORT: Row[] = [
  arrival("08:00", "09:30"),
  gohArrival("09:30", "09:35"),
  { time: "09:35", end: "10:00", title: "Briefing of the Guest of Honour", type: "OPENING_CEREMONY", people: [[SANYATWE, "FACILITATOR"]] },
  { time: "10:00", end: "10:10", title: "National Anthem and Prayer", type: "OPENING_CEREMONY" },
  welcome("10:10", "10:20"),
  performance("10:20", "10:25"),
  introduction("10:25", "10:35"),
  {
    time: "10:35",
    end: "10:55",
    title: "Keynote Address by the Vice President of the Republic of Zimbabwe",
    type: "KEYNOTE",
    people: [
      [CHIWENGA, "GUEST_OF_HONOUR"],
      [SANYATWE, "FACILITATOR"],
    ],
  },
  performance("10:55", "11:00"),
  {
    time: "11:00",
    end: "11:10",
    title: "Keynote: How sports infrastructure, events and participation drive tourism, health and GDP",
    type: "KEYNOTE",
    people: [[COVENTRY, "SPEAKER"]],
  },
  gifts("11:10", "11:15"),
  {
    time: "11:15",
    end: "11:20",
    title: "Vote of Thanks",
    type: "OPENING_CEREMONY",
    description: "By the Chairman of the Sport and Recreation Commission.",
    people: [[MADZIVANYIKA, "SPEAKER"]],
  },
  { time: "11:20", end: "11:35", title: "Photoshoot and Departure of Dignitaries", type: "NETWORKING" },
  { time: "11:35", end: "12:30", title: "Tour of the Exhibition by the Guest of Honour", type: "NETWORKING", people: [[SANYATWE, "FACILITATOR"]] },
  {
    time: "11:35",
    end: "12:30",
    title: "Panel 1: Business of Play",
    type: "PANEL_DISCUSSION",
    description: "Moving from amateur reliance to commercial viability: broadcasting rights, sponsorship models and professional administration.",
    people: [
      [p("Mr N. Magwizi"), "SPEAKER"],
      [p("Hon. T. Mukuhlani"), "PANELLIST"],
      [p("Com. M. Munzwembiri"), "PANELLIST"],
      [CHAGONDA, "PANELLIST"],
      [p("Ms M. Gadzirayi"), "PANELLIST"],
      [MANGUNDA, "MODERATOR"],
    ],
  },
  qa("12:30", "12:45"),
  { time: "12:45", end: "13:45", title: "Lunch", type: "LUNCH" },
  {
    time: "13:45",
    end: "14:30",
    title: "Panel 2: From Jersey to Brand",
    type: "PANEL_DISCUSSION",
    description: "How to turn athletes into investable assets and protect their wealth, bridging the gap between talent earnings and long-term capital.",
    people: [
      [p("Mr S. Mutoya"), "SPEAKER"],
      [p("Mr S. Raza"), "PANELLIST"],
      [p("Mrs K. Kadzombe"), "PANELLIST"],
      [SIMBA, "MODERATOR"],
    ],
  },
  qa("14:30", "14:45"),
  {
    time: "14:45",
    end: "15:30",
    title: "Panel 3: Safeguarding the Game",
    type: "PANEL_DISCUSSION",
    description: "The Billion-Dollar Pivot: turning sports betting into an engine for African sports development.",
    people: [
      [p("Mr E. P. Kesitilwe"), "SPEAKER"],
      [p("Dr M. P. Chingozha"), "PANELLIST"],
      [p("Dr N. Kaseke"), "PANELLIST"],
      [p("Mr K. Ndlovu"), "PANELLIST"],
      [MANGUNDA, "MODERATOR"],
    ],
  },
  qa("15:30", "15:45"),
  {
    time: "15:45",
    end: "16:00",
    title: "Call for Action",
    type: "CLOSING_SESSION",
    description:
      "The role of the sport industry as a critical pillar of Zimbabwe's GDP, and why government, the private sector and National Sport Associations must work together.",
    people: [
      [p("Mrs P. Kadungure"), "SPEAKER"],
      [SIMBA, "MODERATOR"],
    ],
  },
];

// Thursday 8 October: Creative Economy Conference --------------------------------
const CREATIVE: Row[] = [
  arrival("08:00", "09:30"),
  gohArrival("09:30", "09:35"),
  { time: "09:35", end: "09:55", title: "Briefing of the Guest of Honour", type: "OPENING_CEREMONY", people: [[SANYATWE, "FACILITATOR"]] },
  { time: "09:55", end: "10:00", title: "Entrance Artistic and Cultural Performance: Praise Poetry", type: "CULTURAL_PERFORMANCE" },
  { time: "10:00", end: "10:05", title: "National Anthem", type: "OPENING_CEREMONY" },
  { time: "10:05", end: "10:10", title: "Prayer", type: "OPENING_CEREMONY" },
  welcome("10:10", "10:20"),
  performance("10:20", "10:30"),
  introduction("10:30", "10:40"),
  {
    time: "10:40",
    end: "11:00",
    title: "Keynote Address by the Vice President of the Republic of Zimbabwe",
    type: "KEYNOTE",
    people: [
      [MOHADI, "GUEST_OF_HONOUR"],
      [SANYATWE, "FACILITATOR"],
    ],
  },
  performance("11:00", "11:10"),
  {
    time: "11:10",
    end: "11:20",
    title: "Keynote: Creative Economy as Zimbabwe's Next Economic Frontier",
    type: "KEYNOTE",
    people: [[AL_FAYEZ, "SPEAKER"]],
  },
  gifts("11:20", "11:25"),
  {
    time: "11:25",
    end: "11:35",
    title: "Vote of Thanks",
    type: "OPENING_CEREMONY",
    description: "By the Board Chair of the National Gallery of Zimbabwe.",
    people: [[CHEDA, "SPEAKER"]],
  },
  { time: "11:35", end: "11:50", title: "Photoshoot and Departure of Dignitaries", type: "NETWORKING" },
  { time: "11:50", end: "12:45", title: "Tour of the Exhibition Stands by the Guest of Honour", type: "NETWORKING", people: [[SANYATWE, "FACILITATOR"]] },
  {
    time: "11:50",
    end: "12:45",
    title: "Panel 1: Investing in Zimbabwe's Creative Economy",
    type: "PANEL_DISCUSSION",
    description: "Unlocking capital, markets and growth.",
    people: [
      [p("Mr G. Mangwere"), "PANELLIST"],
      [p("Ms F. Ncube"), "PANELLIST"],
      [CHAGONDA, "PANELLIST"],
      [p("Mrs T. Muchinguri"), "PANELLIST"],
      [EVANS, "MODERATOR"],
    ],
  },
  qa("12:45", "13:00"),
  { time: "13:00", end: "13:50", title: "Lunch", type: "LUNCH" },
  {
    time: "13:50",
    end: "14:35",
    title: "Panel 2: Building Competitive Creative Value Chains and Ecosystems",
    type: "PANEL_DISCUSSION",
    people: [
      [p("Mr G. Ngonyamo"), "PANELLIST"],
      [p("Mr K. Chikomo"), "PANELLIST"],
      [p("Mr A. Majuru"), "PANELLIST"],
      [EVANS, "MODERATOR"],
    ],
  },
  qa("14:35", "14:50"),
  {
    time: "14:50",
    end: "15:35",
    title: "Panel 3: Research, Evidence and the Future of Zimbabwe's Creative Economy",
    type: "PANEL_DISCUSSION",
    people: [
      [p("Mrs F. Majachani"), "PANELLIST"],
      [p("Mr T. Murahwi"), "PANELLIST"],
      [p("Prof. C. Tembo"), "PANELLIST"],
      [p("Ms L. Sidambe"), "PANELLIST"],
      [EVANS, "MODERATOR"],
    ],
  },
  qa("15:35", "15:50"),
  {
    time: "15:50",
    end: "16:35",
    title: "Building Zimbabwe's Creative Economy Ecosystem Towards Vision 2030",
    type: "PANEL_DISCUSSION",
    people: [
      [p("Chief Dakamela"), "SPEAKER"],
      [p("Mr N. Munyati"), "PANELLIST"],
      [p("Mr M. N. Masunda"), "PANELLIST"],
      [EVANS, "MODERATOR"],
    ],
  },
  qa("16:35", "16:50"),
  {
    time: "16:50",
    end: "17:00",
    title: "Call for Action and Vote of Thanks",
    type: "CLOSING_SESSION",
    description: "By the Chief Executive Officer of the National Arts Council of Zimbabwe.",
    people: [
      [NYANHI, "SPEAKER"],
      [EVANS, "MODERATOR"],
    ],
  },
];

const THEME = "Kuzana: Towards Vision 2030 through Sport and Creative Industries";

const CONFERENCES = [
  {
    findSlugs: ["sports-industry-conference"],
    slug: "sports-industry-conference",
    title: "Sport Industry Conference",
    summary: "Official opening of KUZANA SCEEZ: keynotes and panels on the business of sport, athletes as brands, and safeguarding the game.",
    day: "2026-10-07",
    start: "08:00",
    end: "16:00",
    rows: SPORT,
    featured: [
      [CHIWENGA, "GUEST_OF_HONOUR"],
      [COVENTRY, "SPEAKER"],
      [MOYO, "FACILITATOR"],
    ] as Role[],
  },
  {
    findSlugs: ["conference-2", "creative-economy-conference"],
    slug: "creative-economy-conference",
    title: "Creative Economy Conference",
    summary: "Official opening of the Creative Economy Conference: investing in Zimbabwe's creative economy, value chains, research and the road to Vision 2030.",
    day: "2026-10-08",
    start: "08:00",
    end: "17:00",
    rows: CREATIVE,
    featured: [
      [MOHADI, "GUEST_OF_HONOUR"],
      [AL_FAYEZ, "SPEAKER"],
      [MOYO, "FACILITATOR"],
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

export async function applyConferenceProgrammes(db: PrismaClient) {
  if (await db.siteSetting.findUnique({ where: { key: FLAG } })) return;

  const people = new Map<string, string>();
  async function personId(person: P) {
    const slug = slugify(person.name);
    const cached = people.get(slug);
    if (cached) return cached;
    const row = await db.person.upsert({
      where: { slug },
      update: {},
      create: { slug, name: person.name, jobTitle: person.jobTitle ?? null, organisation: person.organisation ?? null },
    });
    people.set(slug, row.id);
    return row.id;
  }

  for (const c of CONFERENCES) {
    const event = await db.event.findFirst({ where: { slug: { in: c.findSlugs } } });
    if (!event) continue;
    await db.event.update({
      where: { id: event.id },
      data: {
        title: c.title,
        slug: c.slug,
        summary: c.summary,
        description: `**Theme:** ${THEME}\n\n**Venue:** Zimbabwe International Trade Fair, Hall 2\n\n**Director of Ceremonies:** ${MOYO.name}, ${MOYO.jobTitle}`,
        startsAt: at(`${c.day}T${c.start}`),
        endsAt: at(`${c.day}T${c.end}`),
        timeTbc: false,
        room: "Hall 2",
        isConference: true,
      },
    });

    // Replace the placeholder agenda with the official running order.
    await db.session.deleteMany({ where: { eventId: event.id } });
    for (const [i, r] of c.rows.entries()) {
      const session = await db.session.create({
        data: {
          eventId: event.id,
          title: r.title,
          type: r.type,
          description: r.description ?? null,
          startsAt: at(`${c.day}T${r.time}`),
          endsAt: r.end ? at(`${c.day}T${r.end}`) : null,
          room: "Hall 2",
          sortOrder: i,
          publishStatus: "PUBLISHED",
        },
      });
      for (const [j, [person, role]] of (r.people ?? []).entries()) {
        await db.sessionParticipant.create({ data: { sessionId: session.id, personId: await personId(person), role, sortOrder: j } });
      }
    }

    await db.eventParticipant.deleteMany({ where: { eventId: event.id } });
    for (const [j, [person, role]] of c.featured.entries()) {
      await db.eventParticipant.create({ data: { eventId: event.id, personId: await personId(person), role, sortOrder: j } });
    }
  }

  await db.siteSetting.create({ data: { key: FLAG, value: new Date().toISOString() } });
}
