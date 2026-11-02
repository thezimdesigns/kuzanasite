"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { adminFormAction, runAdmin } from "@/lib/admin-action";
import { db } from "@/lib/db";
import { getCurrentEdition } from "@/lib/edition";
import { checkbox, optionalText, optionalUrl, requiredText } from "@/lib/forms";
import { MentionPlatform, NewsKind, PublishStatus } from "@/lib/generated/prisma/enums";
import { detectPlatform, hostOf } from "@/lib/coverage";
import { fetchLinkPreview } from "@/lib/link-preview";
import { slugify, uniqueSlug } from "@/lib/slug";
import { deleteObject } from "@/lib/storage";
import { parseLocalInput } from "@/lib/time";
import { keyToReportDay, readGroups, statGroupsSchema } from "@/lib/stats";

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

/** One in-text image from the editor ([image N] in the story). */
const storyImageSchema = z.object({
  number: z.number().int().min(1).max(999),
  key: z.string().regex(/^staff\/[\w/.-]+$/),
  alt: optionalText(200),
  caption: optionalText(300),
  credit: optionalText(150),
  creditUrl: optionalUrl,
  width: z.number().int().positive().max(20000).nullable().optional(),
  height: z.number().int().positive().max(20000).nullable().optional(),
});

/** Saves a story's in-text images: removes dropped ones (and their files), adds and updates the rest. */
async function setImages(postId: string, images: z.infer<typeof storyImageSchema>[]) {
  const unique = [...new Map(images.map((i) => [i.number, i])).values()];
  const gone = await db.newsPostImage.findMany({ where: { postId, number: { notIn: unique.map((i) => i.number) } } });
  await db.$transaction([
    db.newsPostImage.deleteMany({ where: { id: { in: gone.map((g) => g.id) } } }),
    ...unique.map((i) => {
      const data = {
        key: i.key,
        alt: i.alt ?? null,
        caption: i.caption ?? null,
        credit: i.credit ?? null,
        creditUrl: i.creditUrl ?? null,
        width: i.width ?? null,
        height: i.height ?? null,
      };
      return db.newsPostImage.upsert({ where: { postId_number: { postId, number: i.number } }, update: data, create: { ...data, postId, number: i.number } });
    }),
  ]);
  for (const g of gone) if (!unique.some((i) => i.key === g.key)) await deleteObject(g.key);
}

const newsSchema = z.object({
  title: requiredText("Headline", 160),
  slug: z.string().trim().max(90).optional(),
  excerpt: optionalText(320),
  body: requiredText("Story", 50000),
  coverKey: optionalText(300),
  coverAlt: optionalText(200),
  coverCaption: optionalText(300),
  coverCredit: optionalText(150),
  coverCreditUrl: optionalUrl,
  pdf: z
    .string()
    .optional()
    .transform((s) => {
      if (!s) return null;
      try {
        return z
          .object({ key: z.string().startsWith("staff/"), mimeType: z.literal("application/pdf"), size: z.number(), fileName: z.string().optional() })
          .parse(JSON.parse(s));
      } catch {
        return null;
      }
    }),
  removePdf: checkbox,
  author: optionalText(120),
  eventId: optionalText(40).transform((v) => v ?? null),
  featured: checkbox,
  publishStatus: z.enum(PublishStatus),
  publishedAt: z
    .string()
    .optional()
    .transform((v) => parseLocalInput(v) ?? new Date()),
  kind: z.enum(NewsKind).default("UPDATE"),
  seriesId: optionalText(40).transform((v) => v ?? null),
  seriesPart: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(1).max(999).optional()),
  exhibitorIds: z.array(z.string().max(40)).default([]),
  personIds: z.array(z.string().max(40)).default([]),
  images: z
    .string()
    .default("[]")
    .transform((s, ctx) => {
      try {
        return JSON.parse(s) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "Images could not be read. Reload the page and try again." });
        return z.NEVER;
      }
    })
    .pipe(z.array(storyImageSchema).max(40)),
});

const NEWS_ARRAYS = { arrays: ["exhibitorIds", "personIds"] };

/** Replaces the exhibitors and people a story features. */
async function setFeatured(postId: string, d: { exhibitorIds: string[]; personIds: string[] }) {
  await db.$transaction([
    db.newsPostExhibitor.deleteMany({ where: { postId } }),
    db.newsPostPerson.deleteMany({ where: { postId } }),
    db.newsPostExhibitor.createMany({ data: [...new Set(d.exhibitorIds)].map((exhibitorId) => ({ postId, exhibitorId })), skipDuplicates: true }),
    db.newsPostPerson.createMany({ data: [...new Set(d.personIds)].map((personId) => ({ postId, personId })), skipDuplicates: true }),
  ]);
}

function newsData(d: z.infer<typeof newsSchema>) {
  const { slug: _s, exhibitorIds: _e, personIds: _p, images: _i, pdf, removePdf, ...rest } = d;
  return {
    ...rest,
    excerpt: d.excerpt ?? null,
    coverKey: d.coverKey ?? null,
    coverAlt: d.coverAlt ?? null,
    coverCaption: d.coverCaption ?? null,
    coverCredit: d.coverCredit ?? null,
    coverCreditUrl: d.coverCreditUrl ?? null,
    // A new PDF replaces the old one; "Remove" clears it; otherwise it stays as it was.
    ...(pdf ? { pdfKey: pdf.key, pdfName: pdf.fileName ?? null, pdfSize: pdf.size } : removePdf ? { pdfKey: null, pdfName: null, pdfSize: null } : {}),
    author: d.author ?? null,
    seriesPart: d.seriesId ? (d.seriesPart ?? null) : null,
  };
}

export const createNews = adminFormAction(
  "press",
  newsSchema,
  async (d, user) => {
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
    await setFeatured(post.id, d);
    await setImages(post.id, d.images);
    redirect(`/admin/news/${post.id}?saved=1`);
  },
  NEWS_ARRAYS,
);

export const updateNews = adminFormAction(
  "press",
  newsSchema.and(z.object({ id: z.string() })),
  async (d) => {
    const old = await db.newsPost.findUniqueOrThrow({ where: { id: d.id } });
    await db.newsPost.update({
      where: { id: d.id },
      data: { ...newsData(d), ...(d.slug && { slug: slugify(d.slug) }) },
    });
    await setFeatured(d.id, d);
    await setImages(d.id, d.images);
    if (old.coverKey && old.coverKey !== d.coverKey) await deleteObject(old.coverKey);
    if (old.pdfKey && (d.removePdf || (d.pdf && d.pdf.key !== old.pdfKey))) await deleteObject(old.pdfKey);
    return { ok: true, message: "Story saved." };
  },
  NEWS_ARRAYS,
);

export async function deleteNews(id: string) {
  await runAdmin("press", async () => {
    const images = await db.newsPostImage.findMany({ where: { postId: id }, select: { key: true } });
    const p = await db.newsPost.delete({ where: { id } });
    if (p.coverKey) await deleteObject(p.coverKey);
    if (p.pdfKey) await deleteObject(p.pdfKey);
    for (const i of images) await deleteObject(i.key);
  });
  redirect("/admin/news");
}

// ---------------------------------------------------------------------------
// Series (e.g. "Signal")
// ---------------------------------------------------------------------------

const seriesSchema = z.object({
  id: optionalText(40),
  title: requiredText("Title", 80),
  slug: z.string().trim().max(60).optional(),
  tagline: optionalText(200),
  description: optionalText(3000),
  author: optionalText(120),
  coverKey: optionalText(300),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  publishStatus: z.enum(PublishStatus),
});

export const saveSeries = adminFormAction("press", seriesSchema, async (d) => {
  const { id, slug: rawSlug, ...data } = d;
  const fields = { ...data, tagline: d.tagline ?? null, description: d.description ?? null, author: d.author ?? null, coverKey: d.coverKey ?? null };
  if (id) {
    const old = await db.series.findUniqueOrThrow({ where: { id } });
    await db.series.update({ where: { id }, data: { ...fields, ...(rawSlug && { slug: slugify(rawSlug) }) } });
    if (old.coverKey && old.coverKey !== fields.coverKey) await deleteObject(old.coverKey);
    return { ok: true, message: "Series saved." };
  }
  const slug = await uniqueSlug(rawSlug || d.title, async (s) => !!(await db.series.findUnique({ where: { slug: s } })));
  const created = await db.series.create({ data: { ...fields, slug } });
  redirect(`/admin/series?edit=${created.id}`);
});

// ---------------------------------------------------------------------------
// Story submissions ("Share your KUZANA story")
// ---------------------------------------------------------------------------

/** Turns a submission into a draft participant story, with the answers laid out as an interview to edit. */
export async function startStoryDraft(id: string) {
  const postId = await runAdmin("press", async (user) => {
    const s = await db.storySubmission.findUniqueOrThrow({ where: { id } });
    if (s.postId && (await db.newsPost.findUnique({ where: { id: s.postId } }))) return s.postId;
    const who = s.organisation ? `${s.name} of ${s.organisation}` : s.name;
    const qa = (q: string, a: string | null) => (a ? `**${q}**\n\n${a}` : null);
    const body = [
      `*Draft from ${who}'s answers to "Share your KUZANA story". Edit into a story before publishing.*`,
      qa("How did you take part in KUZANA?", s.tookPart),
      qa("What came out of it?", s.outcomes),
      qa("What are you working on now?", s.workingOn),
      qa("Will you be back?", s.returning),
    ]
      .filter(Boolean)
      .join("\n\n");
    const edition = await getCurrentEdition();
    const slug = await uniqueSlug(`${s.organisation ?? s.name} story`, async (x) => !!(await db.newsPost.findUnique({ where: { slug: x } })));
    const post = await db.newsPost.create({
      data: {
        title: s.organisation ? `${s.organisation}: after KUZANA` : `${s.name}: after KUZANA`,
        slug,
        body,
        kind: "STORY",
        publishStatus: "DRAFT",
        coverKey: s.photoKey,
        coverAlt: s.photoKey ? who : null,
        editionId: edition?.id,
        createdById: user.id,
        ...(s.exhibitorId && { exhibitors: { create: { exhibitorId: s.exhibitorId } } }),
        ...(s.personId && { people: { create: { personId: s.personId } } }),
      },
    });
    await db.storySubmission.update({ where: { id }, data: { status: "DRAFTED", postId: post.id } });
    return post.id;
  });
  redirect(`/admin/news/${postId}`);
}

export async function setSubmissionStatus(id: string, status: "NEW" | "ARCHIVED") {
  return runAdmin("press", () => db.storySubmission.update({ where: { id }, data: { status } }));
}

export async function deleteSeries(id: string) {
  await runAdmin("press", async () => {
    const s = await db.series.delete({ where: { id } });
    if (s.coverKey) await deleteObject(s.coverKey);
  });
  redirect("/admin/series");
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
