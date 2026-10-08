"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { adminFormAction, runAdmin } from "@/lib/admin-action";
import { db } from "@/lib/db";
import { getCurrentEdition } from "@/lib/edition";
import { checkbox, optionalText, requiredText } from "@/lib/forms";
import { MentionPlatform, PublishStatus } from "@/lib/generated/prisma/enums";
import { detectPlatform, hostOf } from "@/lib/coverage";
import { fetchLinkPreview } from "@/lib/link-preview";
import { slugify, uniqueSlug } from "@/lib/slug";
import { deleteObject } from "@/lib/storage";
import { parseLocalInput } from "@/lib/time";
import { keyToReportDay, readGroups, statGroupsSchema } from "@/lib/stats";

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
  const post = await db.newsPost.create({
    data: {
      ...newsData(d),
      slug,
      editionId: edition?.id,
      createdById: user.id,
    },
  });
  redirect(`/admin/news/${post.id}?saved=1`);
});

export const updateNews = adminFormAction("press", newsSchema.and(z.object({ id: z.string() })), async (d) => {
  const old = await db.newsPost.findUniqueOrThrow({ where: { id: d.id } });
  await db.newsPost.update({
    where: { id: d.id },
    data: { ...newsData(d), ...(d.slug && { slug: slugify(d.slug) }) },
  });
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
    await db.siteSetting.upsert({
      where: { key: "brand.logoKey" },
      update: { value: d.logoKey },
      create: { key: "brand.logoKey", value: d.logoKey },
    });
  } else {
    await db.siteSetting.deleteMany({ where: { key: "brand.logoKey" } });
  }
  return {
    ok: true,
    message: d.logoKey ? "Logo updated." : "Logo reset to the KUZANA SCEEZ default.",
  };
});

export const addHeroSlide = adminFormAction("site", z.object({ imageKey: requiredText("Image", 300), alt: optionalText(200) }), async (d) => {
  const max = await db.heroSlide.aggregate({ _max: { sortOrder: true } });
  await db.heroSlide.create({
    data: {
      imageKey: d.imageKey,
      alt: d.alt ?? null,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
  return { ok: true, message: "Slide added to the homepage." };
});

export async function toggleHeroSlide(id: string, active: boolean) {
  return runAdmin("site", () => db.heroSlide.update({ where: { id }, data: { active } }));
}

export async function moveHeroSlide(id: string, direction: -1 | 1) {
  return runAdmin("site", async () => {
    const slides = await db.heroSlide.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const i = slides.findIndex((s) => s.id === id);
    const other = slides[i + direction];
    if (!other) return;
    await db.$transaction(slides.map((s, n) => db.heroSlide.update({ where: { id: s.id }, data: { sortOrder: n } })));
    await db.$transaction([
      db.heroSlide.update({
        where: { id },
        data: { sortOrder: i + direction },
      }),
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

// ---------------------------------------------------------------------------
// Media coverage ("In the media")
// ---------------------------------------------------------------------------

const mentionSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Paste the link.")
    .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
    .pipe(z.url("Enter a valid link.")),
  title: optionalText(300),
  outlet: optionalText(120),
  platform: z.enum(MentionPlatform).optional().catch(undefined),
  excerpt: optionalText(400),
  publishedAt: z
    .string()
    .optional()
    .transform((v) => parseLocalInput(v) ?? null),
  imageKey: optionalText(300),
  featured: checkbox,
  publishStatus: z.enum(PublishStatus),
});

/** Fills title, outlet, summary, image and date from the page when left empty. */
async function mentionData(d: z.infer<typeof mentionSchema>) {
  const needsPreview = !d.title || !d.outlet || !d.excerpt || !d.publishedAt;
  const p = needsPreview ? await fetchLinkPreview(d.url) : {};
  const title = d.title ?? p.title;
  if (!title) throw new Error("This site doesn't share its title. Please type a title.");
  return {
    url: d.url,
    title,
    outlet: d.outlet ?? p.outlet ?? hostOf(d.url),
    platform: d.platform ?? detectPlatform(d.url),
    excerpt: d.excerpt ?? p.excerpt ?? null,
    imageUrl: p.imageUrl ?? null,
    imageKey: d.imageKey ?? null,
    publishedAt: d.publishedAt ?? p.publishedAt ?? null,
    featured: d.featured,
    publishStatus: d.publishStatus,
  };
}

export const createMention = adminFormAction("press", mentionSchema, async (d) => {
  const data = await mentionData(d);
  await db.mediaMention.create({ data });
  return { ok: true, message: `Added: ${data.title}` };
});

export const updateMention = adminFormAction("press", mentionSchema.and(z.object({ id: z.string() })), async (d) => {
  const { id, ...rest } = d;
  const data = await mentionData(rest);
  const old = await db.mediaMention.findUniqueOrThrow({ where: { id } });
  await db.mediaMention.update({
    where: { id },
    data: { ...data, imageUrl: data.imageUrl ?? old.imageUrl },
  });
  if (old.imageKey && old.imageKey !== data.imageKey) await deleteObject(old.imageKey);
  return { ok: true, message: "Saved." };
});

export async function deleteMention(id: string) {
  return runAdmin("press", async () => {
    const m = await db.mediaMention.delete({ where: { id } });
    if (m.imageKey) await deleteObject(m.imageKey);
  });
}

// ---------------------------------------------------------------------------
// Daily figures ("KUZANA in numbers")
// ---------------------------------------------------------------------------

const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.");

/** Starts a day's report from the previous day's groups and figures, so only what changed needs editing. */
export async function createDailyReport(day: string) {
  const key = dayKey.parse(day);
  const report = await runAdmin("press", async () => {
    const existing = await db.dailyReport.findUnique({ where: { day: keyToReportDay(key) } });
    if (existing) return existing;
    // Start from the day before (numbers included), so only what changed needs typing.
    const previous =
      (await db.dailyReport.findFirst({ where: { day: { lt: keyToReportDay(key) } }, orderBy: { day: "desc" } })) ??
      (await db.dailyReport.findFirst({ orderBy: { day: "desc" } }));
    const groups = previous ? readGroups(previous.groups) : [{ title: "Exhibitors", showTotal: true, items: [{ label: "", value: 0 }] }];
    return db.dailyReport.create({ data: { day: keyToReportDay(key), groups } });
  });
  redirect(`/admin/stats/${report.id}`);
}

const reportInput = z.object({
  day: dayKey,
  headline: z.string().trim().max(160),
  note: z.string().trim().max(1000),
  publishStatus: z.enum(PublishStatus),
  groups: statGroupsSchema,
});

export async function saveDailyReport(id: string, input: z.input<typeof reportInput>) {
  const parsed = reportInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the figures." };
  const d = parsed.data;
  const clash = await db.dailyReport.findFirst({ where: { day: keyToReportDay(d.day), NOT: { id } }, select: { id: true } });
  if (clash) return { ok: false as const, message: "Another day's figures already use that date. Open that day instead, or delete it first." };
  await runAdmin("press", () =>
    db.dailyReport.update({
      where: { id },
      data: { day: keyToReportDay(d.day), headline: d.headline || null, note: d.note || null, publishStatus: d.publishStatus, groups: d.groups },
    }),
  );
  return { ok: true as const, message: d.publishStatus === "PUBLISHED" ? "Saved and published." : "Saved as a draft." };
}

export async function deleteDailyReport(id: string) {
  await runAdmin("press", () => db.dailyReport.delete({ where: { id } }));
  redirect("/admin/stats");
}
