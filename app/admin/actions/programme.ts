"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { adminFormAction, runAdmin } from "@/lib/admin-action";
import { db } from "@/lib/db";
import { requireCurrentEdition } from "@/lib/edition";
import { checkbox, optionalText, optionalUrl, requiredText } from "@/lib/forms";
import { AnnouncementPriority, ParticipantRole, RoutePointKind, ProgrammeStatus, PublishStatus, SessionType } from "@/lib/generated/prisma/enums";
import { slugify, uniqueSlug } from "@/lib/slug";
import { dateKey, formatTime, parseLocalInput } from "@/lib/time";
import { resolveMapLink } from "@/lib/geo-server";

const localDate = (label: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      const d = parseLocalInput(v);
      if (!d) {
        ctx.addIssue({ code: "custom", message: `${label} is required.` });
        return z.NEVER;
      }
      return d;
    });

const optionalLocalDate = z
  .string()
  .trim()
  .optional()
  .transform((v) => parseLocalInput(v) ?? null);

const optionalId = optionalText(40).transform((v) => v ?? null);
const optionalStatus = z
  .string()
  .optional()
  .transform((v) => (v && v in ProgrammeStatus ? (v as ProgrammeStatus) : null));

/** JSON from an UploadField in "json" mode; empty when no new file was chosen. */
const uploadedFile = z
  .string()
  .optional()
  .transform((s) => {
    if (!s) return null;
    try {
      return z
        .object({
          key: z.string().startsWith("staff/"),
          mimeType: z.string(),
          size: z.number(),
          fileName: z.string().optional(),
        })
        .parse(JSON.parse(s));
    } catch {
      return null;
    }
  });

const slugField = z
  .string()
  .trim()
  .max(90)
  .optional()
  .transform((v) => (v ? slugify(v) : undefined));

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

const eventSchema = z
  .object({
    title: requiredText("Title"),
    slug: slugField,
    summary: optionalText(400),
    description: optionalText(20000),
    categoryId: optionalId,
    venueId: optionalId,
    room: optionalText(120),
    startsAt: localDate("Start"),
    endsAt: optionalLocalDate,
    timeTbc: checkbox,
    dailyHours: checkbox,
    isConference: checkbox,
    featured: checkbox,
    ticketRequired: checkbox,
    ticketPrice: optionalText(120),
    ticketUrl: optionalUrl,
    registrationRequired: checkbox,
    registrationUrl: optionalUrl,
    contact: optionalText(300),
    posterKey: optionalText(300),
    imageKey: optionalText(300),
    bannerKey: optionalText(300),
    bannerMobileKey: optionalText(300),
    programmePdf: uploadedFile,
    removeProgrammePdf: checkbox,
    statusOverride: optionalStatus,
    statusNote: optionalText(300),
    publishStatus: z.enum(PublishStatus),
    sortOrder: z.coerce.number().int().default(0),
  })
  .refine((v) => !v.endsAt || v.endsAt >= v.startsAt, {
    message: "End must be after the start.",
    path: ["endsAt"],
  })
  .refine((v) => !v.dailyHours || (v.endsAt && dateKey(v.endsAt) !== dateKey(v.startsAt)), {
    message: "For daily hours, set the end to the last day (e.g. 10 Oct, 17:00).",
    path: ["endsAt"],
  })
  .refine((v) => !v.dailyHours || !v.endsAt || formatTime(v.endsAt) > formatTime(v.startsAt), {
    message: "The closing time must be later in the day than the opening time.",
    path: ["endsAt"],
  });

function eventData(d: z.infer<typeof eventSchema>) {
  const { slug: _slug, programmePdf, removeProgrammePdf, ...rest } = d;
  return {
    ...rest,
    ...(programmePdf
      ? {
          programmePdfKey: programmePdf.key,
          programmePdfName: programmePdf.fileName ?? "programme.pdf",
          programmePdfSize: programmePdf.size,
        }
      : removeProgrammePdf
        ? {
            programmePdfKey: null,
            programmePdfName: null,
            programmePdfSize: null,
          }
        : {}),
    summary: d.summary ?? null,
    description: d.description ?? null,
    room: d.room ?? null,
    ticketPrice: d.ticketPrice ?? null,
    ticketUrl: d.ticketUrl ?? null,
    registrationUrl: d.registrationUrl ?? null,
    contact: d.contact ?? null,
    posterKey: d.posterKey ?? null,
    imageKey: d.imageKey ?? null,
    bannerKey: d.bannerKey ?? null,
    bannerMobileKey: d.bannerMobileKey ?? null,
    statusNote: d.statusNote ?? null,
  };
}

export const createEvent = adminFormAction("programme", eventSchema, async (d, user) => {
  const edition = await requireCurrentEdition();
  const slug = await uniqueSlug(d.slug ?? d.title, async (s) => !!(await db.event.findUnique({ where: { slug: s } })));
  const event = await db.event.create({
    data: {
      ...eventData(d),
      slug,
      editionId: edition.id,
      createdById: user.id,
      updatedById: user.id,
    },
  });
  redirect(`/admin/events/${event.id}?saved=1`);
});

export const updateEvent = adminFormAction("programme", eventSchema.and(z.object({ id: z.string() })), async (d, user) => {
  const data = eventData(d);
  await db.event.update({
    where: { id: d.id },
    data: { ...data, ...(d.slug && { slug: d.slug }), updatedById: user.id },
  });
  return { ok: true, message: "Event saved." };
});

export async function setEventStatus(id: string, status: ProgrammeStatus | null, note?: string) {
  return runAdmin("programme", (user) =>
    db.event.update({
      where: { id },
      data: {
        statusOverride: status,
        statusNote: note ?? null,
        updatedById: user.id,
      },
    }),
  );
}

export async function deleteEvent(id: string) {
  await runAdmin("programme", () => db.event.delete({ where: { id } }));
  redirect("/admin/events");
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

const sessionSchema = z
  .object({
    eventId: z.string(),
    title: requiredText("Title"),
    description: optionalText(5000),
    startsAt: localDate("Start"),
    endsAt: optionalLocalDate,
    room: optionalText(120),
    posterKey: optionalText(300),
    type: z.enum(SessionType),
    statusOverride: optionalStatus,
    publishStatus: z.enum(PublishStatus),
    sortOrder: z.coerce.number().int().default(0),
  })
  .refine((v) => !v.endsAt || v.endsAt >= v.startsAt, {
    message: "End must be after the start.",
    path: ["endsAt"],
  });

export const createSession = adminFormAction("programme", sessionSchema, async (d) => {
  await db.session.create({
    data: {
      ...d,
      description: d.description ?? null,
      room: d.room ?? null,
      posterKey: d.posterKey ?? null,
    },
  });
  return { ok: true, message: `Session "${d.title}" added.` };
});

export const updateSession = adminFormAction("programme", sessionSchema.and(z.object({ id: z.string() })), async (d) => {
  const { id, eventId: _e, ...data } = d;
  void _e;
  await db.session.update({
    where: { id },
    data: {
      ...data,
      description: data.description ?? null,
      room: data.room ?? null,
      posterKey: data.posterKey ?? null,
    },
  });
  return { ok: true, message: "Session saved." };
});

export async function deleteSession(id: string) {
  const session = await runAdmin("programme", () => db.session.delete({ where: { id } }));
  redirect(`/admin/events/${session.eventId}`);
}

export async function publishAllSessions(eventId: string) {
  return runAdmin("programme", () =>
    db.session.updateMany({
      where: { eventId, publishStatus: "DRAFT" },
      data: { publishStatus: "PUBLISHED" },
    }),
  );
}

// ---------------------------------------------------------------------------
// Participants (speakers on events and sessions)
// ---------------------------------------------------------------------------

const participantSchema = z.object({
  personId: optionalText(40),
  newName: optionalText(200),
  role: z.enum(ParticipantRole),
  eventId: optionalText(40),
  sessionId: optionalText(40),
});

export const addParticipant = adminFormAction("programme", participantSchema, async (d) => {
  let personId = d.personId;
  if (!personId && d.newName) {
    const slug = await uniqueSlug(d.newName, async (s) => !!(await db.person.findUnique({ where: { slug: s } })));
    personId = (await db.person.create({ data: { name: d.newName, slug } })).id;
  }
  if (!personId) return { ok: false, message: "Choose a person or type a new name." };
  if (d.sessionId) {
    await db.sessionParticipant.upsert({
      where: {
        sessionId_personId_role: {
          sessionId: d.sessionId,
          personId,
          role: d.role,
        },
      },
      update: {},
      create: { sessionId: d.sessionId, personId, role: d.role },
    });
  } else if (d.eventId) {
    await db.eventParticipant.upsert({
      where: {
        eventId_personId_role: { eventId: d.eventId, personId, role: d.role },
      },
      update: {},
      create: { eventId: d.eventId, personId, role: d.role },
    });
  }
  return { ok: true, message: "Participant added." };
});

export async function removeParticipant(kind: "event" | "session", id: string) {
  await runAdmin("programme", async () => {
    if (kind === "event") await db.eventParticipant.delete({ where: { id } });
    else await db.sessionParticipant.delete({ where: { id } });
  });
}

// ---------------------------------------------------------------------------
// People (speakers)
// ---------------------------------------------------------------------------

const personSchema = z.object({
  name: requiredText("Name"),
  slug: slugField,
  jobTitle: optionalText(200),
  organisation: optionalText(200),
  bio: optionalText(10000),
  country: optionalText(100),
  website: optionalUrl,
  linkedin: optionalUrl,
  twitter: optionalUrl,
  instagram: optionalUrl,
  photoKey: optionalText(300),
  publishStatus: z.enum(PublishStatus),
});

const personData = (d: z.infer<typeof personSchema>) => {
  const { slug: _s, ...rest } = d;
  void _s;
  return Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v ?? null])) as typeof rest;
};

export const createPerson = adminFormAction("programme", personSchema, async (d) => {
  const slug = await uniqueSlug(d.slug ?? d.name, async (s) => !!(await db.person.findUnique({ where: { slug: s } })));
  const p = await db.person.create({ data: { ...personData(d), slug } });
  redirect(`/admin/speakers/${p.id}?saved=1`);
});

export const updatePerson = adminFormAction("programme", personSchema.and(z.object({ id: z.string() })), async (d) => {
  await db.person.update({
    where: { id: d.id },
    data: { ...personData(d), ...(d.slug && { slug: d.slug }) },
  });
  return { ok: true, message: "Profile saved." };
});

export async function deletePerson(id: string) {
  await runAdmin("programme", () => db.person.delete({ where: { id } }));
  redirect("/admin/speakers");
}

// ---------------------------------------------------------------------------
// Venues
// ---------------------------------------------------------------------------

const venueSchema = z.object({
  name: requiredText("Name"),
  slug: slugField,
  description: optionalText(5000),
  address: optionalText(300),
  latitude: z.coerce.number().min(-90).max(90).optional().catch(undefined),
  longitude: z.coerce.number().min(-180).max(180).optional().catch(undefined),
  mapUrl: optionalUrl,
  directions: optionalText(5000),
  parking: optionalText(1000),
  accessibility: optionalText(1000),
  openingTimes: optionalText(1000),
  contact: optionalText(300),
  imageKey: optionalText(300),
  googleLocation: optionalText(1000),
  sortOrder: z.coerce.number().int().default(0),
});

/** A pasted Google Maps link (or "lat, lng") fills in the pin and the map link. */
async function venueData(d: z.infer<typeof venueSchema>) {
  const { slug: _s, googleLocation, ...rest } = d;
  const data = Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v ?? null])) as Record<string, unknown>;
  if (googleLocation) {
    const { point, url } = await resolveMapLink(googleLocation);
    if (point) {
      data.latitude = point.lat;
      data.longitude = point.lng;
    }
    if (url) data.mapUrl = url;
    if (!point && !url) throw new Error("That location could not be read. Paste a Google Maps link or coordinates like -20.15, 28.58.");
  }
  return data;
}

export const createVenue = adminFormAction("programme", venueSchema, async (d) => {
  const slug = await uniqueSlug(d.slug ?? d.name, async (s) => !!(await db.venue.findUnique({ where: { slug: s } })));
  const v = await db.venue.create({
    data: {
      ...(await venueData(d)),
      name: d.name,
      slug,
      sortOrder: d.sortOrder,
    },
  });
  redirect(`/admin/venues/${v.id}?saved=1`);
});

export const updateVenue = adminFormAction("programme", venueSchema.and(z.object({ id: z.string() })), async (d) => {
  await db.venue.update({
    where: { id: d.id },
    data: {
      ...(await venueData(d)),
      sortOrder: d.sortOrder,
      ...(d.slug && { slug: d.slug }),
    },
  });
  return { ok: true, message: "Venue saved." };
});

export async function deleteVenue(id: string) {
  await runAdmin("programme", () => db.venue.delete({ where: { id } }));
  redirect("/admin/venues");
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

const announcementSchema = z.object({
  title: requiredText("Title", 200),
  body: optionalText(2000),
  linkUrl: optionalText(500),
  priority: z.enum(AnnouncementPriority),
  eventId: optionalId,
  expiresAt: optionalLocalDate,
  publishStatus: z.enum(PublishStatus),
});

export const createAnnouncement = adminFormAction("announcements", announcementSchema, async (d, user) => {
  const edition = await requireCurrentEdition();
  await db.announcement.create({
    data: {
      ...d,
      body: d.body ?? null,
      linkUrl: d.linkUrl ?? null,
      editionId: edition.id,
      createdById: user.id,
    },
  });
  return {
    ok: true,
    message: d.publishStatus === "PUBLISHED" ? "Announcement published." : "Draft saved.",
  };
});

export const updateAnnouncement = adminFormAction("announcements", announcementSchema.and(z.object({ id: z.string() })), async (d) => {
  const { id, ...data } = d;
  await db.announcement.update({
    where: { id },
    data: { ...data, body: data.body ?? null, linkUrl: data.linkUrl ?? null },
  });
  return { ok: true, message: "Announcement saved." };
});

export async function archiveAnnouncement(id: string) {
  return runAdmin("announcements", () =>
    db.announcement.update({
      where: { id },
      data: { publishStatus: "ARCHIVED" },
    }),
  );
}

export async function deleteAnnouncement(id: string) {
  return runAdmin("announcements", () => db.announcement.delete({ where: { id } }));
}

// ---------------------------------------------------------------------------
// Routes (e.g. marathon distances) and their map points
// ---------------------------------------------------------------------------

const routeSchema = z.object({
  eventId: z.string(),
  name: requiredText("Name", 60),
  distanceKm: z.coerce.number().positive().max(500).optional().catch(undefined),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, "Pick a colour.")
    .default("#f36c21"),
  sortOrder: z.coerce.number().int().default(0),
});

export const createRoute = adminFormAction("programme", routeSchema, async (d) => {
  await db.eventRoute.create({
    data: { ...d, distanceKm: d.distanceKm ?? null },
  });
  return {
    ok: true,
    message: `${d.name} route added. Click the map to place its start, turning points and finish.`,
  };
});

export const updateRoute = adminFormAction("programme", routeSchema.and(z.object({ id: z.string() })), async (d) => {
  const { id, eventId: _e, ...data } = d;
  await db.eventRoute.update({
    where: { id },
    data: { ...data, distanceKm: data.distanceKm ?? null },
  });
  return { ok: true, message: "Route saved." };
});

export async function deleteRoute(id: string) {
  return runAdmin("programme", () => db.eventRoute.delete({ where: { id } }));
}

const pointInput = z.object({
  routeId: z.string(),
  kind: z.enum(RoutePointKind),
  label: z.string().trim().max(80).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/** Adds a point placed on the map (or pasted). START goes first, FINISH last. */
export async function addRoutePoint(input: z.input<typeof pointInput>) {
  const p = pointInput.parse(input);
  return runAdmin("programme", async () => {
    const points = await db.routePoint.findMany({
      where: { routeId: p.routeId },
      orderBy: { sortOrder: "asc" },
    });
    const finishIndex = points.findIndex((x) => x.kind === "FINISH");
    let sortOrder = points.length ? points[points.length - 1].sortOrder + 1 : 0;
    if (p.kind === "START") sortOrder = (points[0]?.sortOrder ?? 1) - 1;
    else if (p.kind !== "FINISH" && finishIndex >= 0) {
      // Insert before the finish: shift the finish (and anything after) down.
      sortOrder = points[finishIndex].sortOrder;
      await db.$transaction(
        points.slice(finishIndex).map((x) =>
          db.routePoint.update({
            where: { id: x.id },
            data: { sortOrder: x.sortOrder + 1 },
          }),
        ),
      );
    }
    return db.routePoint.create({
      data: {
        routeId: p.routeId,
        kind: p.kind,
        label: p.label || null,
        latitude: p.lat,
        longitude: p.lng,
        sortOrder,
      },
    });
  });
}

/** Adds a point from a pasted Google Maps link or "lat, lng". */
export async function addRoutePointFromLink(routeId: string, kind: RoutePointKind, label: string, link: string) {
  const { point } = await resolveMapLink(link);
  if (!point) throw new Error("Could not read a location from that link.");
  return addRoutePoint({
    routeId,
    kind,
    label,
    lat: point.lat,
    lng: point.lng,
  });
}

export async function moveRoutePoint(id: string, lat: number, lng: number) {
  const c = z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .parse({ lat, lng });
  return runAdmin("programme", () =>
    db.routePoint.update({
      where: { id },
      data: { latitude: c.lat, longitude: c.lng },
    }),
  );
}

export async function updateRoutePoint(id: string, kind: RoutePointKind, label: string) {
  const k = z.enum(RoutePointKind).parse(kind);
  return runAdmin("programme", () =>
    db.routePoint.update({
      where: { id },
      data: { kind: k, label: label.trim().slice(0, 80) || null },
    }),
  );
}

export async function reorderRoutePoint(id: string, direction: -1 | 1) {
  return runAdmin("programme", async () => {
    const point = await db.routePoint.findUniqueOrThrow({ where: { id } });
    const points = await db.routePoint.findMany({
      where: { routeId: point.routeId },
      orderBy: { sortOrder: "asc" },
    });
    const i = points.findIndex((x) => x.id === id);
    const other = points[i + direction];
    if (!other) return;
    await db.$transaction(points.map((x, n) => db.routePoint.update({ where: { id: x.id }, data: { sortOrder: n } })));
    await db.$transaction([
      db.routePoint.update({
        where: { id },
        data: { sortOrder: i + direction },
      }),
      db.routePoint.update({ where: { id: other.id }, data: { sortOrder: i } }),
    ]);
  });
}

export async function deleteRoutePoint(id: string) {
  return runAdmin("programme", () => db.routePoint.delete({ where: { id } }));
}

// ---------------------------------------------------------------------------
// Live streams (several per event or session)
// ---------------------------------------------------------------------------

const streamSchema = z.object({
  eventId: optionalText(40),
  sessionId: optionalText(40),
  label: requiredText("Label", 80),
  url: z
    .string()
    .trim()
    .max(500)
    .regex(/^https?:\/\/\S+$/i, "Enter a full link starting with https://"),
  active: checkbox,
});

export const createStream = adminFormAction("programme", streamSchema, async (d) => {
  if (!d.eventId && !d.sessionId) return { ok: false, message: "Missing event." };
  const count = await db.eventStream.count({
    where: d.sessionId ? { sessionId: d.sessionId } : { eventId: d.eventId },
  });
  await db.eventStream.create({
    data: {
      eventId: d.sessionId ? null : d.eventId,
      sessionId: d.sessionId ?? null,
      label: d.label,
      url: d.url,
      active: d.active,
      sortOrder: count,
    },
  });
  return { ok: true, message: "Stream added." };
});

export const updateStream = adminFormAction("programme", streamSchema.and(z.object({ id: z.string() })), async (d) => {
  await db.eventStream.update({
    where: { id: d.id },
    data: { label: d.label, url: d.url, active: d.active },
  });
  return { ok: true, message: "Stream saved." };
});

export async function toggleStream(id: string) {
  return runAdmin("programme", async () => {
    const s = await db.eventStream.findUniqueOrThrow({ where: { id } });
    await db.eventStream.update({ where: { id }, data: { active: !s.active } });
  });
}

export async function moveStream(id: string, direction: -1 | 1) {
  return runAdmin("programme", async () => {
    const s = await db.eventStream.findUniqueOrThrow({ where: { id } });
    const siblings = await db.eventStream.findMany({
      where: s.sessionId ? { sessionId: s.sessionId } : { eventId: s.eventId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const i = siblings.findIndex((x) => x.id === id);
    const other = siblings[i + direction];
    if (!other) return;
    siblings[i] = other;
    siblings[i + direction] = s;
    await db.$transaction(siblings.map((x, n) => db.eventStream.update({ where: { id: x.id }, data: { sortOrder: n } })));
  });
}

export async function deleteStream(id: string) {
  return runAdmin("programme", async () => {
    await db.eventStream.delete({ where: { id } });
  });
}
