"use server";

import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { adminFormAction, runAdmin } from "@/lib/admin-action";
import { db } from "@/lib/db";
import { requireCurrentEdition } from "@/lib/edition";
import { optionalText, optionalUrl, requiredText } from "@/lib/forms";
import { PartnerTier, Role } from "@/lib/generated/prisma/enums";
import { deleteObject } from "@/lib/storage";
import { parseLocalInput } from "@/lib/time";

// ---------------------------------------------------------------------------
// Partners
// ---------------------------------------------------------------------------

const partnerSchema = z.object({
  name: requiredText("Name"),
  url: optionalUrl,
  tier: z.enum(PartnerTier),
  caption: optionalText(100),
  logoKey: optionalText(300),
  sortOrder: z.coerce.number().int().default(0),
});

export const createPartner = adminFormAction("site", partnerSchema, async (d) => {
  const edition = await requireCurrentEdition();
  await db.partner.create({ data: { ...d, editionId: edition.id } });
  return { ok: true, message: "Partner added." };
});

export const updatePartner = adminFormAction("site", partnerSchema.and(z.object({ id: z.string() })), async (d) => {
  const { id, ...data } = d;
  await db.partner.update({
    where: { id },
    data: {
      ...data,
      url: data.url ?? null,
      caption: data.caption ?? null,
      // A newly uploaded logo replaces the bundled one.
      ...(data.logoKey && { logoKey: data.logoKey, logoUrl: null }),
    },
  });
  return { ok: true, message: "Partner saved." };
});

export async function deletePartner(id: string) {
  return runAdmin("site", async () => {
    const p = await db.partner.delete({ where: { id } });
    if (p.logoKey) await deleteObject(p.logoKey);
  });
}

// ---------------------------------------------------------------------------
// Content pages
// ---------------------------------------------------------------------------

export const updatePage = adminFormAction(
  "site",
  z.object({ id: z.string(), title: requiredText("Title"), summary: optionalText(400), body: requiredText("Content", 50000) }),
  async (d, user) => {
    await db.page.update({ where: { id: d.id }, data: { title: d.title, summary: d.summary ?? null, body: d.body, updatedById: user.id } });
    return { ok: true, message: "Page saved." };
  },
);

// ---------------------------------------------------------------------------
// Users (SUPER_ADMIN only)
// ---------------------------------------------------------------------------

const password = z.string().min(10, "Password must be at least 10 characters.").max(128);

export const createUser = adminFormAction(
  "users",
  z.object({
    name: requiredText("Name"),
    email: z.email("Enter a valid email.").transform((v) => v.toLowerCase()),
    role: z.enum(Role),
    password,
  }),
  async (d) => {
    if (await db.user.findUnique({ where: { email: d.email } })) return { ok: false, message: "A user with that email already exists." };
    const id = randomUUID();
    await db.user.create({
      data: {
        id,
        name: d.name,
        email: d.email,
        role: d.role,
        emailVerified: true,
        accounts: { create: { id: randomUUID(), accountId: id, providerId: "credential", password: await hashPassword(d.password) } },
      },
    });
    return { ok: true, message: `Account created for ${d.email}. Share the password securely.` };
  },
);

export const updateUser = adminFormAction(
  "users",
  z.object({
    id: z.string(),
    role: z.enum(Role),
    active: z.enum(["true", "false"]).transform((v) => v === "true"),
    password: z
      .string()
      .optional()
      .transform((v) => v || undefined)
      .pipe(password.optional()),
  }),
  async (d, user) => {
    if (d.id === user.id && (d.role !== "SUPER_ADMIN" || !d.active)) {
      return { ok: false, message: "You can't remove your own super-admin access." };
    }
    await db.user.update({ where: { id: d.id }, data: { role: d.role, active: d.active } });
    if (!d.active) await db.authSession.deleteMany({ where: { userId: d.id } });
    if (d.password) {
      await db.account.updateMany({ where: { userId: d.id, providerId: "credential" }, data: { password: await hashPassword(d.password) } });
      await db.authSession.deleteMany({ where: { userId: d.id } });
    }
    return { ok: true, message: "User updated." };
  },
);

// ---------------------------------------------------------------------------
// Editions (e.g. KUZANA SCEEZ 2027)
// ---------------------------------------------------------------------------

export const createEdition = adminFormAction(
  "site",
  z.object({
    year: z.coerce.number().int().min(2020).max(2100),
    name: requiredText("Name"),
    theme: optionalText(300),
    startDate: z.string().transform((v, ctx) => {
      const d = parseLocalInput(v);
      if (!d) ctx.addIssue({ code: "custom", message: "Start date is required." });
      return d ?? z.NEVER;
    }),
    endDate: z.string().transform((v, ctx) => {
      const d = parseLocalInput(v);
      if (!d) ctx.addIssue({ code: "custom", message: "End date is required." });
      return d ?? z.NEVER;
    }),
  }),
  async (d) => {
    if (await db.edition.findUnique({ where: { year: d.year } })) return { ok: false, message: `${d.year} already exists.` };
    await db.edition.create({ data: { ...d, theme: d.theme ?? null, endDate: new Date(d.endDate.getTime() + 86_399_000) } });
    return { ok: true, message: `${d.name} created. Make it current when you are ready to switch the site over.` };
  },
);

/** Switches the live site to another edition; earlier editions stay in the archive. */
export async function setCurrentEdition(id: string) {
  return runAdmin("site", () =>
    db.$transaction([
      db.edition.updateMany({ data: { isCurrent: false } }),
      db.edition.update({ where: { id }, data: { isCurrent: true } }),
    ]),
  );
}
