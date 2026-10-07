"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { adminFormAction, runAdmin } from "@/lib/admin-action";
import { db } from "@/lib/db";
import { requireCurrentEdition } from "@/lib/edition";
import { checkbox, optionalText, optionalUrl, requiredText } from "@/lib/forms";
import {
  AnnouncementPriority,
  ParticipantRole,
  ProgrammeStatus,
  PublishStatus,
  SessionType,
} from "@/lib/generated/prisma/enums";
import { slugify, uniqueSlug } from "@/lib/slug";
import { parseLocalInput } from "@/lib/time";

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
        .object({ key: z.string().startsWith("staff/"), mimeType: z.string(), size: z.number(), fileName: z.string().optional() })
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
    programmePdf: uploadedFile,
    removeProgrammePdf: checkbox,
    statusOverride: optionalStatus,
    statusNote: optionalText(300),
    publishStatus: z.enum(PublishStatus),
    sortOrder: z.coerce.number().int().default(0),
  })
  .refine((v) => !v.endsAt || v.endsAt >= v.startsAt, { message: "End must be after the start.", path: ["endsAt"] });

function eventData(d: z.infer<typeof eventSchema>) {
  const { slug: _slug, programmePdf, removeProgrammePdf, ...rest } = d;
  return {
    ...rest,
    ...(programmePdf
      ? { programmePdfKey: programmePdf.key, programmePdfName: programmePdf.fileName ?? "programme.pdf", programmePdfSize: programmePdf.size }
      : removeProgrammePdf
        ? { programmePdfKey: null, programmePdfName: null, programmePdfSize: null }
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
    statusNote: d.statusNote ?? null,
  };
}

export const createEvent = adminFormAction("programme", eventSchema, async (d, user) => {
  const edition = await requireCurrentEdition();
  const slug = await uniqueSlug(d.slug ?? d.title, async (s) => !!(await db.event.findUnique({ where: { slug: s } })));
  const event = await db.event.create({
    data: { ...eventData(d), slug, editionId: edition.id, createdById: user.id, updatedById: user.id },
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
    db.event.update({ where: { id }, data: { statusOverride: status, statusNote: note ?? null, updatedById: user.id } }),
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
  .refine((v) => !v.endsAt || v.endsAt >= v.startsAt, { message: "End must be after the start.", path: ["endsAt"] });

export const createSession = adminFormAction("programme", sessionSchema, async (d) => {
  await db.session.create({ data: { ...d, description: d.description ?? null, room: d.room ?? null, posterKey: d.posterKey ?? null } });
  return { ok: true, message: `Session "${d.title}" added.` };
});

export const updateSession = adminFormAction("programme", sessionSchema.and(z.object({ id: z.string() })), async (d) => {
  const { id, eventId: _e, ...data } = d;
  void _e;
  await db.session.update({
    where: { id },
    data: { ...data, description: data.description ?? null, room: data.room ?? null, posterKey: data.posterKey ?? null },
  });
  return { ok: true, message: "Session saved." };
});

export async function deleteSession(id: string) {
  const session = await runAdmin("programme", () => db.session.delete({ where: { id } }));
  redirect(`/admin/events/${session.eventId}`);
}

export async function publishAllSessions(eventId: string) {
  return runAdmin("programme", () => db.session.updateMany({ where: { eventId, publishStatus: "DRAFT" }, data: { publishStatus: "PUBLISHED" } }));
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
      where: { sessionId_personId_role: { sessionId: d.sessionId, personId, role: d.role } },
      update: {},
      create: { sessionId: d.sessionId, personId, role: d.role },
    });
  } else if (d.eventId) {
    await db.eventParticipant.upsert({
      where: { eventId_personId_role: { eventId: d.eventId, personId, role: d.role } },
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
  await db.person.update({ where: { id: d.id }, data: { ...personData(d), ...(d.slug && { slug: d.slug }) } });
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
  sortOrder: z.coerce.number().int().default(0),
});

const venueData = (d: z.infer<typeof venueSchema>) => {
  const { slug: _s, ...rest } = d;
  void _s;
  return Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v ?? null])) as typeof rest;
};

export const createVenue = adminFormAction("programme", venueSchema, async (d) => {
  const slug = await uniqueSlug(d.slug ?? d.name, async (s) => !!(await db.venue.findUnique({ where: { slug: s } })));
  const v = await db.venue.create({ data: { ...venueData(d), slug, sortOrder: d.sortOrder } });
  redirect(`/admin/venues/${v.id}?saved=1`);
});

export const updateVenue = adminFormAction("programme", venueSchema.and(z.object({ id: z.string() })), async (d) => {
  await db.venue.update({ where: { id: d.id }, data: { ...venueData(d), sortOrder: d.sortOrder, ...(d.slug && { slug: d.slug }) } });
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
    data: { ...d, body: d.body ?? null, linkUrl: d.linkUrl ?? null, editionId: edition.id, createdById: user.id },
  });
  return { ok: true, message: d.publishStatus === "PUBLISHED" ? "Announcement published." : "Draft saved." };
});

export const updateAnnouncement = adminFormAction("announcements", announcementSchema.and(z.object({ id: z.string() })), async (d) => {
  const { id, ...data } = d;
  await db.announcement.update({ where: { id }, data: { ...data, body: data.body ?? null, linkUrl: data.linkUrl ?? null } });
  return { ok: true, message: "Announcement saved." };
});

export async function archiveAnnouncement(id: string) {
  return runAdmin("announcements", () => db.announcement.update({ where: { id }, data: { publishStatus: "ARCHIVED" } }));
}

export async function deleteAnnouncement(id: string) {
  return runAdmin("announcements", () => db.announcement.delete({ where: { id } }));
}
