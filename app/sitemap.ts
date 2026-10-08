import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { MEDIA_SECTIONS } from "@/lib/options";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics = [
    "", "/live", "/programme", "/programme/today", "/events", "/conferences", "/speakers", "/exhibitors", "/venues",
    "/news", "/map", "/gallery", "/videos", "/media", "/feedback", "/plan-your-visit", "/partners", "/archive", "/register", "/privacy",
    ...Object.keys(MEDIA_SECTIONS).map((s) => `/media/${s}`),
  ];
  const [events, exhibitors, people, venues, albums, docs, editions, news, routed] = await Promise.all([
    db.event.findMany({ where: { publishStatus: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.exhibitor.findMany({ where: { status: "APPROVED" }, select: { slug: true, updatedAt: true } }),
    db.person.findMany({ where: { publishStatus: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.venue.findMany({ select: { slug: true, updatedAt: true } }),
    db.photoAlbum.findMany({ where: { publishStatus: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.document.findMany({ where: { publishStatus: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.edition.findMany({ select: { year: true, updatedAt: true } }),
    db.newsPost.findMany({ where: { publishStatus: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.event.findMany({ where: { publishStatus: "PUBLISHED", routes: { some: {} } }, select: { slug: true, updatedAt: true } }),
  ]);
  const entry = (path: string, lastModified?: Date) => ({ url: siteUrl(path), lastModified });
  return [
    ...statics.map((p) => entry(p)),
    ...events.map((e) => entry(`/events/${e.slug}`, e.updatedAt)),
    ...exhibitors.map((e) => entry(`/exhibitors/${e.slug}`, e.updatedAt)),
    ...people.map((e) => entry(`/speakers/${e.slug}`, e.updatedAt)),
    ...venues.map((e) => entry(`/venues/${e.slug}`, e.updatedAt)),
    ...albums.map((e) => entry(`/gallery/${e.slug}`, e.updatedAt)),
    ...docs.map((e) => entry(`/media/documents/${e.slug}`, e.updatedAt)),
    ...editions.map((e) => entry(`/archive/${e.year}`, e.updatedAt)),
    ...news.map((n) => entry(`/news/${n.slug}`, n.updatedAt)),
    ...routed.map((e) => entry(`/events/${e.slug}/route`, e.updatedAt)),
  ];
}
