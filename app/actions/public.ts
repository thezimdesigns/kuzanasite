"use server";

import { z } from "zod";
import { findValidClaim } from "@/lib/claim";
import { db } from "@/lib/db";
import { requireCurrentEdition } from "@/lib/edition";
import { exhibitorCodeValid } from "@/lib/exhibitor-access";
import {
  checkbox,
  formToObject,
  invalid,
  optionalEmail,
  optionalText,
  optionalUrl,
  phone,
  requiredText,
  stringValues,
  type FormState,
} from "@/lib/forms";
import { ExhibitorMediaKind } from "@/lib/generated/prisma/enums";
import { FEEDBACK_CATEGORIES, INTEREST_TYPES, OPPORTUNITIES, VISITOR_INTERESTS, VISITOR_TYPES } from "@/lib/options";
import { rateLimit } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { uniqueSlug } from "@/lib/slug";

const TOO_MANY: FormState = { ok: false, message: "Too many submissions. Please wait a few minutes and try again." };
const CAPTCHA: FormState = { ok: false, message: "We couldn't verify your submission. Please refresh the page and try again." };

/** Honeypot: real people never fill the hidden "website_url" field. */
const isBot = (fd: FormData) => !!fd.get("website_url");

async function guard(fd: FormData, name: string, limit: number, windowSec: number): Promise<FormState | null> {
  if (isBot(fd)) return { ok: true, message: "Thank you." };
  if (!(await rateLimit(name, limit, windowSec))) return TOO_MANY;
  if (!(await verifyRecaptcha(fd.get("recaptchaToken") as string | null, name))) return CAPTCHA;
  return null;
}

// ---------------------------------------------------------------------------
// Register interest (future editions)
// ---------------------------------------------------------------------------

const interestSchema = z
  .object({
    name: requiredText("Full name"),
    organisation: optionalText(200),
    email: optionalEmail,
    phone: optionalText(30),
    country: optionalText(100),
    interest: z.enum(INTEREST_TYPES, { error: "Choose what you're interested in." }),
    message: optionalText(2000),
    consent: checkbox.refine((v) => v, "Please agree so we can contact you."),
  })
  .refine((v) => v.email || v.phone, { message: "Give an email or phone number.", path: ["email"] });

export async function submitInterest(_: FormState, fd: FormData): Promise<FormState> {
  const blocked = await guard(fd, "interest", 8, 600);
  if (blocked) return blocked;
  const parsed = interestSchema.safeParse(formToObject(fd));
  if (!parsed.success) return invalid(parsed.error, fd);
  await db.interestRegistration.create({ data: parsed.data });
  return { ok: true, message: "Thank you. Your interest has been captured and we will be in touch." };
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

const feedbackSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES, { error: "Choose a category." }),
  message: requiredText("Message", 4000),
  rating: z.coerce.number().int().min(1).max(5).optional().catch(undefined),
  eventId: optionalText(40),
  venueId: optionalText(40),
  anonymous: checkbox,
  name: optionalText(200),
  email: optionalEmail,
  phone: optionalText(30),
  contactPermission: checkbox,
});

export async function submitFeedback(_: FormState, fd: FormData): Promise<FormState> {
  const blocked = await guard(fd, "feedback", 10, 600);
  if (blocked) return blocked;
  const parsed = feedbackSchema.safeParse(formToObject(fd));
  if (!parsed.success) return invalid(parsed.error, fd);
  const d = parsed.data;
  await db.feedback.create({
    data: {
      ...d,
      name: d.anonymous ? null : d.name,
      email: d.anonymous ? null : d.email,
      phone: d.anonymous ? null : d.phone,
      contactPermission: d.anonymous ? false : d.contactPermission,
      eventId: (await db.event.findUnique({ where: { id: d.eventId ?? "" } })) ? d.eventId : null,
      venueId: (await db.venue.findUnique({ where: { id: d.venueId ?? "" } })) ? d.venueId : null,
    },
  });
  return { ok: true, message: "Thank you for your feedback. The KUZANA team reviews every message." };
}

// ---------------------------------------------------------------------------
// Visitor registration
// ---------------------------------------------------------------------------

const visitorSchema = z
  .object({
    name: requiredText("Full name"),
    phone: optionalText(30),
    email: optionalEmail,
    organisation: optionalText(200),
    city: optionalText(100),
    country: optionalText(100),
    ageRange: optionalText(20),
    visitorType: z.enum(VISITOR_TYPES).optional().catch(undefined),
    interests: z.array(z.enum(VISITOR_INTERESTS)).default([]),
    emailConsent: checkbox,
    consent: checkbox.refine((v) => v, "Please accept the privacy notice to register."),
  })
  .refine((v) => v.email || v.phone, { message: "Give a mobile number or an email address.", path: ["phone"] });

export async function registerVisitor(_: FormState, fd: FormData): Promise<FormState> {
  const blocked = await guard(fd, "visitor", 10, 600);
  if (blocked) return blocked;
  const parsed = visitorSchema.safeParse(formToObject(fd, ["interests"]));
  if (!parsed.success) return invalid(parsed.error, fd);
  const { consent: _consent, ...data } = parsed.data;
  void _consent;
  const visitor = await db.visitor.create({ data: { ...data, emailConsent: data.emailConsent && !!data.email } });
  return { ok: true, id: visitor.id, message: "You're registered. Welcome to KUZANA SCEEZ!" };
}

// ---------------------------------------------------------------------------
// Exhibitor registration (unlisted, QR-code access)
// ---------------------------------------------------------------------------

const mediaItem = z.object({
  key: z.string().startsWith("public/exhibitors/").max(300),
  kind: z.enum(ExhibitorMediaKind),
  mimeType: z.string().max(120),
  size: z.number().int().nonnegative(),
  fileName: z.string().max(200).optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
});

const exhibitorSchema = z.object({
  name: requiredText("Organisation name"),
  contactName: requiredText("Contact person"),
  phone,
  categoryId: requiredText("Sector", 40),
  email: optionalEmail,
  hall: optionalText(60),
  stand: optionalText(60),
  description: optionalText(1500),
  showcasing: optionalText(1500),
  website: optionalUrl,
  facebook: optionalUrl,
  instagram: optionalUrl,
  linkedin: optionalUrl,
  tiktok: optionalUrl,
  whatsapp: optionalText(30),
  address: optionalText(300),
  opportunities: z.array(z.enum(OPPORTUNITIES)).default([]),
  seeking: optionalText(1500),
  offering: optionalText(1500),
  consent: checkbox.refine((v) => v, "Please confirm you are authorised and give permission to publish."),
  media: z
    .string()
    .default("[]")
    .transform((s, ctx) => {
      try {
        return z.array(mediaItem).max(12).parse(JSON.parse(s));
      } catch {
        ctx.addIssue({ code: "custom", message: "Some uploads were invalid. Please re-add them." });
        return z.NEVER;
      }
    }),
});

export async function submitExhibitorRegistration(_: FormState, fd: FormData): Promise<FormState> {
  if (!exhibitorCodeValid(fd.get("code") as string | null)) {
    return { ok: false, message: "This registration link is not valid. Please scan the QR code at the exhibitor desk." };
  }
  const blocked = await guard(fd, "exhibitor", 12, 3600);
  if (blocked) return blocked;
  const parsed = exhibitorSchema.safeParse(formToObject(fd, ["opportunities"]));
  if (!parsed.success) return invalid(parsed.error, fd);
  const { media, consent, ...data } = parsed.data;
  if (!media.some((m) => m.kind === "BOOTH")) {
    return {
      ok: false,
      message: "Please add at least one photo of your stand.",
      errors: { media: "Add at least one stand photo." },
      values: stringValues(fd),
    };
  }
  if (!(await db.exhibitorCategory.findUnique({ where: { id: data.categoryId } }))) {
    return { ok: false, errors: { categoryId: "Choose a sector." }, values: stringValues(fd) };
  }

  const edition = await requireCurrentEdition();
  const slug = await uniqueSlug(data.name, async (s) => !!(await db.exhibitor.findUnique({ where: { slug: s } })));
  const logo = media.find((m) => m.kind === "LOGO");
  await db.exhibitor.create({
    data: {
      ...data,
      slug,
      editionId: edition.id,
      consent,
      consentAt: new Date(),
      status: "PENDING",
      source: "PUBLIC",
      logoKey: logo?.key,
      media: { create: media.map((m, i) => ({ ...m, sortOrder: i })) },
    },
  });
  return {
    ok: true,
    message: "Thank you! Your stand has been submitted. The KUZANA team will review it and publish it in the exhibitor directory.",
  };
}

// ---------------------------------------------------------------------------
// Complete an exhibitor profile through a claim link
// ---------------------------------------------------------------------------

const claimSchema = exhibitorSchema.omit({ categoryId: true }).extend({
  categoryId: optionalText(40),
  media: exhibitorSchema.shape.media,
});

export async function completeExhibitorProfile(_: FormState, fd: FormData): Promise<FormState> {
  if (isBot(fd)) return { ok: true };
  if (!(await rateLimit("claim", 30, 3600))) return TOO_MANY;
  const claim = await findValidClaim(fd.get("claim") as string | null);
  if (!claim) return { ok: false, message: "This link has expired or is no longer valid. Please ask KUZANA for a new one." };

  const parsed = claimSchema.safeParse(formToObject(fd, ["opportunities"]));
  if (!parsed.success) return invalid(parsed.error, fd);
  const { media, consent, categoryId, ...data } = parsed.data;
  const validCategory = categoryId && (await db.exhibitorCategory.findUnique({ where: { id: categoryId } }));
  const logo = media.find((m) => m.kind === "LOGO");
  const startOrder = claim.exhibitor.media.length;

  await db.$transaction([
    db.exhibitor.update({
      where: { id: claim.exhibitorId },
      data: {
        ...data,
        // Clear optional fields the exhibitor emptied.
        email: data.email ?? null,
        website: data.website ?? null,
        facebook: data.facebook ?? null,
        instagram: data.instagram ?? null,
        linkedin: data.linkedin ?? null,
        tiktok: data.tiktok ?? null,
        ...(validCategory && { categoryId }),
        consent,
        consentAt: new Date(),
        ...(logo && { logoKey: logo.key }),
        ...(claim.exhibitor.status === "NEEDS_INFORMATION" && { status: "PENDING" as const }),
        reviewNotes: [claim.exhibitor.reviewNotes, `Updated by exhibitor via completion link (${new Date().toISOString().slice(0, 16)})`]
          .filter(Boolean)
          .join("\n"),
        media: { create: media.map((m, i) => ({ ...m, sortOrder: startOrder + i })) },
      },
    }),
    db.exhibitorClaimToken.update({ where: { id: claim.id }, data: { usedAt: claim.usedAt ?? new Date() } }),
  ]);
  return { ok: true, message: "Thank you. Your exhibitor profile has been updated." };
}

// ---------------------------------------------------------------------------
// Web Push subscriptions and event "Notify me"
// ---------------------------------------------------------------------------

const pushSchema = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
});

export async function savePushSubscription(input: unknown, eventId?: string, visitorId?: string) {
  if (!(await rateLimit("push", 20, 600))) return { ok: false };
  const parsed = pushSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { endpoint, keys } = parsed.data;
  const visitor = visitorId ? await db.visitor.findUnique({ where: { id: visitorId } }) : null;
  const sub = await db.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, active: true, failureCount: 0, ...(visitor ? { visitorId: visitor.id } : {}) },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, visitorId: visitor?.id },
  });
  if (visitor) await db.visitor.update({ where: { id: visitor.id }, data: { pushConsent: true } });
  if (eventId && (await db.event.findUnique({ where: { id: eventId } }))) {
    await db.eventSubscription.upsert({
      where: { eventId_pushSubscriptionId: { eventId, pushSubscriptionId: sub.id } },
      update: {},
      create: { eventId, pushSubscriptionId: sub.id },
    });
  }
  return { ok: true };
}

export async function removePushSubscription(endpoint: string) {
  await db.pushSubscription.updateMany({ where: { endpoint }, data: { active: false } });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------

const ratingSchema = z.object({
  eventId: optionalText(40),
  sessionId: optionalText(40),
  stars: z.coerce.number().int().min(1, "Choose a rating.").max(5),
  comment: optionalText(1000),
});

export async function submitRating(_: FormState, fd: FormData): Promise<FormState> {
  if (isBot(fd)) return { ok: true };
  if (!(await rateLimit("rating", 20, 600))) return TOO_MANY;
  const parsed = ratingSchema.safeParse(formToObject(fd));
  if (!parsed.success) return invalid(parsed.error, fd);
  const { eventId, sessionId, ...rest } = parsed.data;
  const target = sessionId
    ? await db.session.findUnique({ where: { id: sessionId }, select: { id: true } })
    : eventId
      ? await db.event.findUnique({ where: { id: eventId }, select: { id: true } })
      : null;
  if (!target) return { ok: false, message: "Nothing to rate." };
  await db.rating.create({ data: { ...rest, eventId, sessionId } });
  return { ok: true, message: "Thanks for rating!" };
}
