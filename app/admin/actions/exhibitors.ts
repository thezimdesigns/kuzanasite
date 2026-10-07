"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { adminFormAction, runAdmin } from "@/lib/admin-action";
import { createClaimToken } from "@/lib/claim";
import { db } from "@/lib/db";
import { requireCurrentEdition } from "@/lib/edition";
import { checkbox, optionalEmail, optionalText, optionalUrl, phone, requiredText } from "@/lib/forms";
import { ExhibitorMediaKind, ExhibitorStatus } from "@/lib/generated/prisma/enums";
import { OPPORTUNITIES } from "@/lib/options";
import { siteUrl } from "@/lib/site";
import { uniqueSlug } from "@/lib/slug";
import { deleteObject } from "@/lib/storage";

const mediaJson = z
  .string()
  .default("[]")
  .transform((s, ctx) => {
    try {
      return z
        .array(
          z.object({
            key: z.string().max(300),
            kind: z.enum(ExhibitorMediaKind),
            mimeType: z.string().max(120),
            size: z.number().int(),
            fileName: z.string().max(200).optional(),
            width: z.number().int().optional(),
            height: z.number().int().optional(),
          }),
        )
        .parse(JSON.parse(s));
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid uploads." });
      return z.NEVER;
    }
  });

// ---------------------------------------------------------------------------
// Staff fast capture (about one minute per stand)
// ---------------------------------------------------------------------------

const captureSchema = z.object({
  name: requiredText("Organisation name"),
  contactName: requiredText("Contact person"),
  phone,
  categoryId: optionalText(40),
  hall: optionalText(60),
  stand: optionalText(60),
  email: optionalEmail,
  notes: optionalText(2000),
  publishNow: checkbox,
  media: mediaJson,
});

export const captureExhibitor = adminFormAction("exhibitors", captureSchema, async (d, user) => {
  const edition = await requireCurrentEdition();
  const slug = await uniqueSlug(d.name, async (s) => !!(await db.exhibitor.findUnique({ where: { slug: s } })));
  const { media, publishNow, notes, ...data } = d;
  await db.exhibitor.create({
    data: {
      ...data,
      slug,
      editionId: edition.id,
      source: "STAFF",
      status: publishNow ? "APPROVED" : "PENDING",
      reviewNotes: notes ? `Capture notes: ${notes}` : null,
      createdById: user.id,
      updatedById: user.id,
      logoKey: media.find((m) => m.kind === "LOGO")?.key,
      media: { create: media.map((m, i) => ({ ...m, sortOrder: i })) },
    },
  });
  return { ok: true, message: `${d.name} captured${publishNow ? " and published" : ""}. Ready for the next stand.` };
});

// ---------------------------------------------------------------------------
// Edit / review
// ---------------------------------------------------------------------------

const exhibitorSchema = z.object({
  id: z.string(),
  name: requiredText("Organisation name"),
  contactName: requiredText("Contact person"),
  phone,
  email: optionalEmail,
  categoryId: optionalText(40),
  hall: optionalText(60),
  stand: optionalText(60),
  description: optionalText(3000),
  showcasing: optionalText(3000),
  products: optionalText(3000),
  website: optionalUrl,
  facebook: optionalUrl,
  instagram: optionalUrl,
  linkedin: optionalUrl,
  tiktok: optionalUrl,
  whatsapp: optionalText(30),
  address: optionalText(300),
  opportunities: z.array(z.enum(OPPORTUNITIES)).default([]),
  seeking: optionalText(3000),
  offering: optionalText(3000),
  reviewNotes: optionalText(5000),
  media: mediaJson,
});

export const updateExhibitor = adminFormAction(
  "exhibitors",
  exhibitorSchema,
  async (d, user) => {
    const { id, media, ...fields } = d;
    const data = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v ?? null])) as Record<string, unknown>;
    const count = await db.exhibitorMedia.count({ where: { exhibitorId: id } });
    const logo = media.find((m) => m.kind === "LOGO");
    await db.exhibitor.update({
      where: { id },
      data: {
        ...data,
        opportunities: d.opportunities,
        updatedById: user.id,
        ...(logo && { logoKey: logo.key }),
        media: { create: media.map((m, i) => ({ ...m, sortOrder: count + i })) },
      },
    });
    return { ok: true, message: "Exhibitor saved." };
  },
  { arrays: ["opportunities"] },
);

export async function setExhibitorStatus(id: string, status: ExhibitorStatus) {
  return runAdmin("exhibitors", (user) => db.exhibitor.update({ where: { id }, data: { status, updatedById: user.id } }));
}

export async function deleteExhibitor(id: string) {
  await runAdmin("exhibitors", async () => {
    const media = await db.exhibitorMedia.findMany({ where: { exhibitorId: id } });
    await db.exhibitor.delete({ where: { id } });
    await Promise.all(media.map((m) => deleteObject(m.key)));
  });
  redirect("/admin/exhibitors");
}

export async function deleteExhibitorMedia(mediaId: string) {
  return runAdmin("exhibitors", async () => {
    const m = await db.exhibitorMedia.delete({ where: { id: mediaId } });
    await db.exhibitor.updateMany({ where: { id: m.exhibitorId, logoKey: m.key }, data: { logoKey: null } });
    await deleteObject(m.key);
  });
}

export async function setExhibitorLogo(exhibitorId: string, key: string) {
  return runAdmin("exhibitors", () => db.exhibitor.update({ where: { id: exhibitorId }, data: { logoKey: key } }));
}

/** "Request more information": creates a completion link to send by WhatsApp, SMS or email. */
export async function createCompletionLink(exhibitorId: string, markNeedsInfo: boolean) {
  return runAdmin("exhibitors", async (user) => {
    const code = await createClaimToken(exhibitorId, user.id);
    if (markNeedsInfo) await db.exhibitor.update({ where: { id: exhibitorId }, data: { status: "NEEDS_INFORMATION" } });
    return siteUrl(`/exhibitors/claim/${code}`);
  });
}

export async function revokeCompletionLinks(exhibitorId: string) {
  return runAdmin("exhibitors", () =>
    db.exhibitorClaimToken.updateMany({ where: { exhibitorId, revokedAt: null }, data: { revokedAt: new Date() } }),
  );
}
