/**
 * Idempotent seed for the KUZANA SCEEZ 2026 edition.
 * Existing records are never overwritten, so it is safe to re-run after staff
 * have edited content in the CMS. Run with: npm run db:seed
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../lib/generated/prisma/client";
import type { SessionType } from "../lib/generated/prisma/enums";
import { DEFAULT_FOOTER_LINKS } from "../lib/footer-defaults";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

/** Harare wall-clock time (UTC+2) to a Date. */
const at = (local: string) => new Date(`${local}+02:00`);

async function main() {
  const edition = await db.edition.upsert({
    where: { year: 2026 },
    update: {},
    create: {
      year: 2026,
      name: "KUZANA SCEEZ 2026",
      theme: "Towards Vision 2030 through Sports & Creative Industries",
      description:
        "KUZANA SCEEZ 2026 is a sport, creative economy and investment platform connecting talent, capital, brands, institutions and audiences.",
      startDate: at("2026-10-07T00:00:00"),
      endDate: at("2026-10-11T23:59:59"),
      isCurrent: true,
    },
  });

  // Venues --------------------------------------------------------------------
  const venues = {
    zitf: await upsertVenue({
      slug: "zitf",
      name: "Zimbabwe International Trade Fair (ZITF)",
      address: "ZITF Exhibition Centre, Bulawayo, Zimbabwe",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Zimbabwe+International+Trade+Fair+Bulawayo",
      description: "Home of the KUZANA Exhibitions, the conferences and the Boxing Match.",
      sortOrder: 1,
    }),
    gifford: await upsertVenue({
      slug: "gifford-high-school",
      name: "Gifford High School",
      address: "Bulawayo, Zimbabwe",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Gifford+High+School+Bulawayo",
      description: "Start venue for the Kings and Queens Marathon.",
      sortOrder: 2,
    }),
    barbourfields: await upsertVenue({
      slug: "barbourfields-stadium",
      name: "Barbourfields Stadium",
      address: "Bulawayo, Zimbabwe",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Barbourfields+Stadium+Bulawayo",
      description: "Venue for the Centurion Match: Highlanders vs Dynamos.",
      sortOrder: 3,
    }),
  };

  // Categories ----------------------------------------------------------------
  const categoryNames = ["Exhibition", "Conference", "Sport", "Music", "Football"];
  const categories: Record<string, string> = {};
  for (const [i, name] of categoryNames.entries()) {
    const c = await db.eventCategory.upsert({
      where: { name },
      update: {},
      create: { name, slug: name.toLowerCase(), sortOrder: i },
    });
    categories[name] = c.id;
  }

  const sectors = [
    "Sport", "Arts & Culture", "Fashion", "Media", "Technology", "Finance", "Education", "Tourism",
    "Government", "Food", "Entertainment", "Equipment", "Health", "Transport", "Insurance",
    "Professional Services", "Other",
  ];
  for (const [i, name] of sectors.entries()) {
    await db.exhibitorCategory.upsert({
      where: { name },
      update: {},
      create: {
        name,
        slug: name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-"),
        sortOrder: i,
      },
    });
  }

  // Events --------------------------------------------------------------------
  // Times not yet confirmed are marked timeTbc so the site shows "Time TBC".
  const events = [
    {
      slug: "kuzana-exhibitions",
      title: "KUZANA Exhibitions",
      summary: "Sport, arts, fashion, music, film, design, technology and creative enterprises under one roof.",
      startsAt: at("2026-10-07T00:00:00"),
      endsAt: at("2026-10-10T23:59:00"),
      timeTbc: true,
      venueId: venues.zitf,
      category: "Exhibition",
      featured: true,
      sortOrder: 0,
    },
    {
      slug: "sports-industry-conference",
      title: "Sports Industry Conference",
      summary: "Keynotes and panels on the business of sport, infrastructure, branding and safeguarding.",
      startsAt: at("2026-10-07T08:00:00"),
      endsAt: null,
      timeTbc: true,
      venueId: venues.zitf,
      category: "Conference",
      isConference: true,
      featured: true,
      sortOrder: 1,
    },
    {
      slug: "conference-2",
      title: "Conference 2",
      summary: "Day two of the KUZANA conference programme.",
      startsAt: at("2026-10-08T08:00:00"),
      endsAt: null,
      timeTbc: true,
      venueId: venues.zitf,
      category: "Conference",
      isConference: true,
      sortOrder: 2,
    },
    {
      slug: "boxing-match",
      title: "Boxing Match",
      summary: "An evening of professional boxing at ZITF.",
      startsAt: at("2026-10-09T18:00:00"),
      endsAt: null,
      timeTbc: false,
      venueId: venues.zitf,
      category: "Sport",
      featured: true,
      sortOrder: 3,
    },
    {
      slug: "kings-and-queens-marathon",
      title: "Kings and Queens Marathon",
      summary: "Bulawayo's Kings and Queens Marathon.",
      startsAt: at("2026-10-10T06:00:00"),
      endsAt: null,
      timeTbc: true,
      venueId: venues.gifford,
      category: "Sport",
      sortOrder: 4,
    },
    {
      slug: "hkd-music-festival",
      title: "HKD Music Festival",
      summary: "Live music to close the KUZANA week.",
      startsAt: at("2026-10-10T12:00:00"),
      endsAt: null,
      timeTbc: true,
      venueId: null,
      category: "Music",
      featured: true,
      sortOrder: 5,
    },
    {
      slug: "centurion-match-highlanders-vs-dynamos",
      title: "Centurion Match: Highlanders vs Dynamos",
      summary: "The football showcase at Barbourfields Stadium.",
      startsAt: at("2026-10-11T12:00:00"),
      endsAt: null,
      timeTbc: true,
      venueId: venues.barbourfields,
      category: "Football",
      featured: true,
      sortOrder: 6,
    },
  ];

  const eventIds: Record<string, string> = {};
  for (const e of events) {
    const { category, ...data } = e;
    const existing = await db.event.findUnique({ where: { slug: e.slug } });
    const event =
      existing ??
      (await db.event.create({
        data: {
          ...data,
          editionId: edition.id,
          categoryId: categories[category],
          publishStatus: "PUBLISHED",
        },
      }));
    eventIds[e.slug] = event.id;
  }

  // Sports Industry Conference running order --------------------------------
  // Seeded as DRAFT with placeholder times: staff set the real times, then publish.
  const conferenceId = eventIds["sports-industry-conference"];
  const sessionCount = await db.session.count({ where: { eventId: conferenceId } });
  if (sessionCount === 0) {
    const order: [string, SessionType][] = [
      ["Arrival and Registration", "REGISTRATION"],
      ["Arrival of Guest of Honour", "OPENING_CEREMONY"],
      ["Briefing of Guest of Honour", "OPENING_CEREMONY"],
      ["National Anthem and Prayer", "OPENING_CEREMONY"],
      ["Welcome Remarks", "OPENING_CEREMONY"],
      ["Cultural and Artistic Performance", "CULTURAL_PERFORMANCE"],
      ["Introduction of Guest of Honour", "OPENING_CEREMONY"],
      ["Keynote Address", "KEYNOTE"],
      ["Sports Infrastructure Keynote", "KEYNOTE"],
      ["Presentation of Gifts", "OPENING_CEREMONY"],
      ["Vote of Thanks", "OPENING_CEREMONY"],
      ["Photoshoot", "NETWORKING"],
      ["Exhibition Tour", "NETWORKING"],
      ["Panel 1: Business of Play", "PANEL_DISCUSSION"],
      ["Question and Answer Session", "QA"],
      ["Lunch", "LUNCH"],
      ["Panel 2: From Jersey to Brand", "PANEL_DISCUSSION"],
      ["Question and Answer Session", "QA"],
      ["Panel 3: Safeguarding the Game", "PANEL_DISCUSSION"],
      ["Question and Answer Session", "QA"],
      ["Call for Action", "CLOSING_SESSION"],
      ["End of Programme", "CLOSING_SESSION"],
    ];
    const base = at("2026-10-07T08:00:00").getTime();
    await db.session.createMany({
      data: order.map(([title, type], i) => ({
        eventId: conferenceId,
        title,
        type,
        startsAt: new Date(base + i * 15 * 60 * 1000),
        sortOrder: i,
        publishStatus: "DRAFT",
      })),
    });
  }

  // Partners ------------------------------------------------------------------
  if ((await db.partner.count()) === 0) {
    await db.partner.createMany({
      data: [
        { name: "MOSRAC Zimbabwe", logoUrl: "/brand/mosrac-zimbabwe.png", tier: "PARTNER", prominent: true, sortOrder: 1, editionId: edition.id },
        { name: "Nhimbe Trust", logoUrl: "/brand/nhimbe-trust.png", tier: "PARTNER", sortOrder: 2, editionId: edition.id },
        { name: "ZITF", logoUrl: "/brand/zitf.png", tier: "HOST", caption: "Host", sortOrder: 3, editionId: edition.id },
      ],
    });
  }

  // Footer links (then managed in Admin → Footer) --------------------------------
  if ((await db.footerLink.count()) === 0) {
    await db.footerLink.createMany({ data: DEFAULT_FOOTER_LINKS.map((l, i) => ({ ...l, sortOrder: i })) });
  }

  // Editable pages ------------------------------------------------------------
  await upsertPage(
    "plan-your-visit",
    "Plan your visit",
    "Venues, getting there and what to know before you arrive.",
    `## Venues

KUZANA SCEEZ 2026 takes place across Bulawayo from 7 to 11 October 2026:

- **Zimbabwe International Trade Fair (ZITF)**: exhibitions, conferences and the Boxing Match
- **Gifford High School**: Kings and Queens Marathon
- **Barbourfields Stadium**: Centurion Match, Highlanders vs Dynamos

See the [venues page](/venues) for maps and directions.

## Tickets and registration

Each event page shows whether a ticket or registration is needed. Check [today's programme](/programme/today) for times.

## Getting help

Look for KUZANA staff at the information desk, or [send us a message](/feedback) and choose the "Question" or "Lost and Found" category.

## Emergencies

In an emergency, contact venue security or the nearest KUZANA staff member immediately.`,
  );

  await upsertPage(
    "privacy",
    "Privacy notice",
    "How KUZANA SCEEZ collects and uses your information.",
    `KUZANA SCEEZ collects the information you choose to give us through this website: visitor and exhibitor registrations, feedback, and notification sign-ups.

## What we use it for

- To run KUZANA SCEEZ events and keep you informed about programme changes you asked to hear about
- To publish exhibitor profiles in the exhibitor directory, where the exhibitor has given permission
- To respond to your feedback and questions
- To improve future KUZANA editions

## Your choices

- Email and browser notifications are separate opt-ins. You can turn browser notifications off in your browser at any time.
- Every KUZANA email includes an unsubscribe link.
- To see, correct or delete your information, email technical-partner@kuzana.org.zw.

We process personal information in line with Zimbabwe's Cyber and Data Protection Act. We do not sell your information.`,
  );

  // First super admin --------------------------------------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const existing = await db.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      const id = randomUUID();
      await db.user.create({
        data: {
          id,
          email: adminEmail,
          name: process.env.SEED_ADMIN_NAME ?? "KUZANA Admin",
          role: "SUPER_ADMIN",
          emailVerified: true,
          accounts: {
            create: {
              id: randomUUID(),
              accountId: id,
              providerId: "credential",
              password: await hashPassword(adminPassword),
            },
          },
        },
      });
      console.log(`Created super admin ${adminEmail}`);
    }
  } else {
    console.log("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set: no admin user created.");
  }

  console.log("Seed complete.");
}

async function upsertVenue(v: { slug: string; name: string; address: string; mapUrl: string; description: string; sortOrder: number }) {
  const venue = await db.venue.upsert({ where: { slug: v.slug }, update: {}, create: v });
  return venue.id;
}

async function upsertPage(slug: string, title: string, summary: string, body: string) {
  await db.page.upsert({ where: { slug }, update: {}, create: { slug, title, summary, body } });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
