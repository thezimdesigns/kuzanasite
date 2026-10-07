"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { adminFormAction, runAdmin } from "@/lib/admin-action";
import { db } from "@/lib/db";
import { requireCurrentEdition } from "@/lib/edition";
import { checkbox, optionalText, requiredText } from "@/lib/forms";
import { DocumentType, PublishStatus, VideoCategory } from "@/lib/generated/prisma/enums";
import { requireArea } from "@/lib/permissions";
import { slugify, uniqueSlug } from "@/lib/slug";
import { deleteObject } from "@/lib/storage";
import { parseLocalInput } from "@/lib/time";
import { youtubeId } from "@/lib/youtube";

const optionalDay = z
  .string()
  .optional()
  .transform((v) => parseLocalInput(v) ?? null);
const optionalId = optionalText(40).transform((v) => v ?? null);

// ---------------------------------------------------------------------------
// Albums & photos
// ---------------------------------------------------------------------------

const albumSchema = z.object({
  title: requiredText("Title"),
  slug: z.string().trim().max(90).optional(),
  description: optionalText(3000),
  date: optionalDay,
  eventId: optionalId,
  photographer: optionalText(200),
  sortOrder: z.coerce.number().int().default(0),
  publishStatus: z.enum(PublishStatus),
});

export const createAlbum = adminFormAction("media", albumSchema, async (d, user) => {
  const edition = await requireCurrentEdition();
  const slug = await uniqueSlug(d.slug || d.title, async (s) => !!(await db.photoAlbum.findUnique({ where: { slug: s } })));
  const album = await db.photoAlbum.create({
    data: {
      ...d,
      slug,
      description: d.description ?? null,
      photographer: d.photographer ?? null,
      editionId: edition.id,
      createdById: user.id,
    },
  });
  redirect(`/admin/galleries/${album.id}`);
});

export const updateAlbum = adminFormAction("media", albumSchema.and(z.object({ id: z.string() })), async (d) => {
  const { id, slug, ...data } = d;
  await db.photoAlbum.update({
    where: { id },
    data: { ...data, description: data.description ?? null, photographer: data.photographer ?? null, ...(slug && { slug: slugify(slug) }) },
  });
  return { ok: true, message: "Album saved." };
});

const photoBatch = z.array(
  z.object({
    key: z.string().startsWith("staff/").max(300),
    size: z.number().int().optional(),
    width: z.number().int().optional(),
    height: z.number().int().optional(),
  }),
);

/** Adds already-uploaded photos to an album. */
export async function addPhotos(albumId: string, photos: unknown) {
  return runAdmin("media", async () => {
    const list = photoBatch.parse(photos);
    const max = await db.photo.aggregate({ where: { albumId }, _max: { sortOrder: true } });
    const start = (max._max.sortOrder ?? -1) + 1;
    await db.photo.createMany({ data: list.map((p, i) => ({ ...p, albumId, sortOrder: start + i })) });
    const album = await db.photoAlbum.findUnique({ where: { id: albumId }, select: { coverKey: true } });
    if (album && !album.coverKey && list[0]) await db.photoAlbum.update({ where: { id: albumId }, data: { coverKey: list[0].key } });
    return list.length;
  });
}

export async function setAlbumCover(albumId: string, key: string) {
  return runAdmin("media", () => db.photoAlbum.update({ where: { id: albumId }, data: { coverKey: key } }));
}

export async function updatePhotoCaption(photoId: string, caption: string) {
  await requireArea("media");
  await db.photo.update({ where: { id: photoId }, data: { caption: caption.trim().slice(0, 500) || null } });
}

export async function deletePhoto(photoId: string) {
  return runAdmin("media", async () => {
    const p = await db.photo.delete({ where: { id: photoId } });
    await db.photoAlbum.updateMany({ where: { id: p.albumId, coverKey: p.key }, data: { coverKey: null } });
    await deleteObject(p.key);
  });
}

export async function deleteAlbum(id: string) {
  await runAdmin("media", async () => {
    const photos = await db.photo.findMany({ where: { albumId: id }, select: { key: true } });
    await db.photoAlbum.delete({ where: { id } });
    await Promise.all(photos.map((p) => deleteObject(p.key)));
  });
  redirect("/admin/galleries");
}

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------

const videoSchema = z.object({
  title: requiredText("Title"),
  url: z.string().trim().transform((v, ctx) => {
    const id = youtubeId(v);
    if (!id) {
      ctx.addIssue({ code: "custom", message: "Paste a valid YouTube link." });
      return z.NEVER;
    }
    return id;
  }),
  description: optionalText(3000),
  date: optionalDay,
  eventId: optionalId,
  sessionId: optionalId,
  category: z.enum(VideoCategory),
  featured: checkbox,
  publishStatus: z.enum(PublishStatus),
});

export const createVideo = adminFormAction("media", videoSchema, async (d, user) => {
  const edition = await requireCurrentEdition();
  const { url, ...data } = d;
  await db.video.create({ data: { ...data, youtubeId: url, description: d.description ?? null, editionId: edition.id, createdById: user.id } });
  return { ok: true, message: "Video added." };
});

export const updateVideo = adminFormAction("media", videoSchema.and(z.object({ id: z.string() })), async (d) => {
  const { id, url, ...data } = d;
  await db.video.update({ where: { id }, data: { ...data, youtubeId: url, description: data.description ?? null } });
  return { ok: true, message: "Video saved." };
});

export async function deleteVideo(id: string) {
  return runAdmin("media", () => db.video.delete({ where: { id } }));
}

// ---------------------------------------------------------------------------
// Documents & press
// ---------------------------------------------------------------------------

const documentSchema = z.object({
  title: requiredText("Title"),
  slug: z.string().trim().max(90).optional(),
  description: optionalText(2000),
  body: optionalText(50000),
  type: z.enum(DocumentType),
  date: optionalDay,
  author: optionalText(200),
  eventId: optionalId,
  sessionId: optionalId,
  publishStatus: z.enum(PublishStatus),
  file: z
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
    }),
});

function documentData(d: z.infer<typeof documentSchema>) {
  const { file, slug: _s, ...rest } = d;
  void _s;
  return {
    ...rest,
    description: d.description ?? null,
    body: d.body ?? null,
    author: d.author ?? null,
    ...(file && { key: file.key, mimeType: file.mimeType, size: file.size, fileName: file.fileName ?? null }),
  };
}

export const createDocument = adminFormAction("press", documentSchema, async (d, user) => {
  if (!d.file && !d.body) return { ok: false, message: "Upload a file or write the text." };
  const edition = await requireCurrentEdition();
  const slug = await uniqueSlug(d.slug || d.title, async (s) => !!(await db.document.findUnique({ where: { slug: s } })));
  const doc = await db.document.create({ data: { ...documentData(d), slug, editionId: edition.id, createdById: user.id } });
  redirect(`/admin/documents/${doc.id}?saved=1`);
});

export const updateDocument = adminFormAction("press", documentSchema.and(z.object({ id: z.string() })), async (d) => {
  const old = await db.document.findUniqueOrThrow({ where: { id: d.id } });
  await db.document.update({ where: { id: d.id }, data: { ...documentData(d), ...(d.slug && { slug: slugify(d.slug) }) } });
  if (d.file && old.key && old.key !== d.file.key) await deleteObject(old.key);
  return { ok: true, message: "Document saved." };
});

export async function deleteDocument(id: string) {
  await runAdmin("press", async () => {
    const d = await db.document.delete({ where: { id } });
    if (d.key) await deleteObject(d.key);
  });
  redirect("/admin/documents");
}
