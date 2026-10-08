"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { adminFormAction, runAdmin } from "@/lib/admin-action";
import { db } from "@/lib/db";
import { getCurrentEdition } from "@/lib/edition";
import { checkbox, optionalText, requiredText } from "@/lib/forms";
import { PublishStatus } from "@/lib/generated/prisma/enums";
import { slugify, uniqueSlug } from "@/lib/slug";
import { deleteObject } from "@/lib/storage";
import { parseLocalInput } from "@/lib/time";

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

const newsSchema = z.object({
  title: requiredText("Headline", 160),
  slug: z.string().trim().max(90).optional(),
  excerpt: optionalText(320),
  body: requiredText("Story", 50000),
  coverKey: optionalText(300),
  coverAlt: optionalText(200),
  author: optionalText(120),
  eventId: optionalText(40).transform((v) => v ?? null),
  featured: checkbox,
  publishStatus: z.enum(PublishStatus),
  publishedAt: z
    .string()
    .optional()
    .transform((v) => parseLocalInput(v) ?? new Date()),
});

function newsData(d: z.infer<typeof newsSchema>) {
  const { slug: _s, ...rest } = d;
  return {
    ...rest,
    excerpt: d.excerpt ?? null,
    coverKey: d.coverKey ?? null,
    coverAlt: d.coverAlt ?? null,
    author: d.author ?? null,
  };
}

export const createNews = adminFormAction("press", newsSchema, async (d, user) => {
  const edition = await getCurrentEdition();
  const slug = await uniqueSlug(d.slug || d.title, async (s) => !!(await db.newsPost.findUnique({ where: { slug: s } })));
  const post = await db.newsPost.create({ data: { ...newsData(d), slug, editionId: edition?.id, createdById: user.id } });
  redirect(`/admin/news/${post.id}?saved=1`);
});

export const updateNews = adminFormAction("press", newsSchema.and(z.object({ id: z.string() })), async (d) => {
  const old = await db.newsPost.findUniqueOrThrow({ where: { id: d.id } });
  await db.newsPost.update({ where: { id: d.id }, data: { ...newsData(d), ...(d.slug && { slug: slugify(d.slug) }) } });
  if (old.coverKey && old.coverKey !== d.coverKey) await deleteObject(old.coverKey);
  return { ok: true, message: "Story saved." };
});

export async function deleteNews(id: string) {
  await runAdmin("press", async () => {
    const p = await db.newsPost.delete({ where: { id } });
    if (p.coverKey) await deleteObject(p.coverKey);
  });
  redirect("/admin/news");
}

// ---------------------------------------------------------------------------
// Homepage & branding: logo and hero background slides
// ---------------------------------------------------------------------------

export const saveLogo = adminFormAction("site", z.object({ logoKey: optionalText(300) }), async (d) => {
  if (d.logoKey) {
    await db.siteSetting.upsert({ where: { key: "brand.logoKey" }, update: { value: d.logoKey }, create: { key: "brand.logoKey", value: d.logoKey } });
  } else {
    await db.siteSetting.deleteMany({ where: { key: "brand.logoKey" } });
  }
  return { ok: true, message: d.logoKey ? "Logo updated." : "Logo reset to the KUZANA SCEEZ default." };
});

export const addHeroSlide = adminFormAction(
  "site",
  z.object({ imageKey: requiredText("Image", 300), alt: optionalText(200) }),
  async (d) => {
    const max = await db.heroSlide.aggregate({ _max: { sortOrder: true } });
    await db.heroSlide.create({ data: { imageKey: d.imageKey, alt: d.alt ?? null, sortOrder: (max._max.sortOrder ?? -1) + 1 } });
    return { ok: true, message: "Slide added to the homepage." };
  },
);

export async function toggleHeroSlide(id: string, active: boolean) {
  return runAdmin("site", () => db.heroSlide.update({ where: { id }, data: { active } }));
}

export async function moveHeroSlide(id: string, direction: -1 | 1) {
  return runAdmin("site", async () => {
    const slides = await db.heroSlide.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    const i = slides.findIndex((s) => s.id === id);
    const other = slides[i + direction];
    if (!other) return;
    await db.$transaction(slides.map((s, n) => db.heroSlide.update({ where: { id: s.id }, data: { sortOrder: n } })));
    await db.$transaction([
      db.heroSlide.update({ where: { id }, data: { sortOrder: i + direction } }),
      db.heroSlide.update({ where: { id: other.id }, data: { sortOrder: i } }),
    ]);
  });
}

export async function deleteHeroSlide(id: string) {
  return runAdmin("site", async () => {
    const s = await db.heroSlide.delete({ where: { id } });
    if (s.imageKey) await deleteObject(s.imageKey);
  });
}
