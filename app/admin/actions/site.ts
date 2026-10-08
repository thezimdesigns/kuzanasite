"use server";

import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { adminFormAction, runAdmin } from "@/lib/admin-action";
import { db } from "@/lib/db";
import { requireCurrentEdition } from "@/lib/edition";
import { checkbox, optionalText, optionalUrl, requiredText } from "@/lib/forms";
import { PartnerTier, Role } from "@/lib/generated/prisma/enums";
import { deleteObject } from "@/lib/storage";
import { parseLocalInput } from "@/lib/time";
import { DEFAULT_FOOTER_LINKS } from "@/lib/footer-defaults";
import { FOOTER_SETTING_DEFAULTS } from "@/lib/site-settings";

// ---------------------------------------------------------------------------
// Partners
// ---------------------------------------------------------------------------

const partnerSchema = z.object({
  name: requiredText("Name"),
  url: optionalUrl,
  tier: z.enum(PartnerTier),
  caption: optionalText(100),
  description: optionalText(1000),
  facebook: optionalUrl,
  instagram: optionalUrl,
  linkedin: optionalUrl,
  youtube: optionalUrl,
  logoKey: optionalText(300),
  prominent: checkbox,
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
      description: data.description ?? null,
      facebook: data.facebook ?? null,
      instagram: data.instagram ?? null,
      linkedin: data.linkedin ?? null,
      youtube: data.youtube ?? null,
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

// ---------------------------------------------------------------------------
// Footer (settings + link columns)
// ---------------------------------------------------------------------------

const footerSettingsSchema = z.object(
  Object.fromEntries(Object.keys(FOOTER_SETTING_DEFAULTS).map((k) => [k.replace("footer.", ""), optionalText(300)])) as Record<
    string,
    ReturnType<typeof optionalText>
  >,
);

export const saveFooterSettings = adminFormAction("site", footerSettingsSchema, async (d) => {
  await db.$transaction(
    Object.keys(FOOTER_SETTING_DEFAULTS).map((key) => {
      const value = d[key.replace("footer.", "")] ?? "";
      return db.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
    }),
  );
  return { ok: true, message: "Footer details saved." };
});

/** Internal paths ("/programme"), web addresses, email or phone links. */
const linkHref = z
  .string()
  .trim()
  .min(1, "Choose a page or enter a web address.")
  .max(500)
  .transform((v) => (/^(\/|https?:\/\/|mailto:|tel:)/i.test(v) ? v : `https://${v}`))
  .refine((v) => v.startsWith("/") || /^(https?:\/\/[^\s]+\.[^\s]+|mailto:\S+@\S+|tel:[+\d\s()-]+)$/i.test(v), "Enter a valid link.");

const footerLinkSchema = z.object({
  label: requiredText("Label", 80),
  page: z.string().optional(),
  custom: z.string().optional(),
  column: z.coerce.number().int().min(1).max(2),
  newTab: checkbox,
  sortOrder: z.coerce.number().int().default(0),
});

function resolveHref(d: { page?: string; custom?: string }) {
  return linkHref.safeParse(d.page === "__custom" || !d.page ? (d.custom ?? "") : d.page);
}

/** The footer starts from built-in defaults; copy them in before the first edit. */
async function ensureFooterLinks() {
  if ((await db.footerLink.count()) === 0) {
    await db.footerLink.createMany({ data: DEFAULT_FOOTER_LINKS.map((l, i) => ({ ...l, sortOrder: i })) });
  }
}

export const createFooterLink = adminFormAction("site", footerLinkSchema, async (d) => {
  const href = resolveHref(d);
  if (!href.success) return { ok: false, errors: { custom: href.error.issues[0].message } };
  await ensureFooterLinks();
  const max = await db.footerLink.aggregate({ where: { column: d.column }, _max: { sortOrder: true } });
  await db.footerLink.create({
    data: { label: d.label, href: href.data, column: d.column, newTab: d.newTab, sortOrder: (max._max.sortOrder ?? -1) + 1 },
  });
  return { ok: true, message: "Link added to the footer." };
});

export const updateFooterLink = adminFormAction("site", footerLinkSchema.and(z.object({ id: z.string() })), async (d) => {
  const href = resolveHref(d);
  if (!href.success) return { ok: false, errors: { custom: href.error.issues[0].message } };
  await db.footerLink.update({
    where: { id: d.id },
    data: { label: d.label, href: href.data, column: d.column, newTab: d.newTab, sortOrder: d.sortOrder },
  });
  return { ok: true, message: "Link saved." };
});

export async function deleteFooterLink(id: string) {
  return runAdmin("site", () => db.footerLink.delete({ where: { id } }));
}

/** Swaps a link with its neighbour in the same column. */
export async function moveFooterLink(id: string, direction: -1 | 1) {
  return runAdmin("site", async () => {
    const link = await db.footerLink.findUniqueOrThrow({ where: { id } });
    const siblings = await db.footerLink.findMany({ where: { column: link.column }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    const i = siblings.findIndex((s) => s.id === id);
    const other = siblings[i + direction];
    if (!other) return;
    // Normalise order first so equal sortOrder values still swap cleanly.
    await db.$transaction(siblings.map((s, n) => db.footerLink.update({ where: { id: s.id }, data: { sortOrder: n } })));
    await db.$transaction([
      db.footerLink.update({ where: { id }, data: { sortOrder: i + direction } }),
      db.footerLink.update({ where: { id: other.id }, data: { sortOrder: i } }),
    ]);
  });
}
