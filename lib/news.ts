import "server-only";
import { db } from "@/lib/db";

const published = () => ({
  publishStatus: "PUBLISHED" as const,
  publishedAt: { lte: new Date() },
});

/** Published stories, newest first; the featured one (if any) leads. */
export async function getNews(take = 20, skip = 0) {
  const [lead, rest] = await Promise.all([
    skip === 0
      ? db.newsPost.findFirst({
          where: { ...published(), featured: true },
          orderBy: { publishedAt: "desc" },
        })
      : null,
    db.newsPost.findMany({
      where: published(),
      orderBy: { publishedAt: "desc" },
      take: take + 1,
      skip,
    }),
  ]);
  const list = lead ? [lead, ...rest.filter((p) => p.id !== lead.id)] : rest;
  return { posts: list.slice(0, take), hasMore: list.length > take };
}

export async function getNewsPost(slug: string) {
  return db.newsPost.findFirst({
    where: { slug, publishStatus: { in: ["PUBLISHED", "ARCHIVED"] } },
    include: { event: { select: { title: true, slug: true } } },
  });
}

export const readingMinutes = (body: string) => Math.max(1, Math.round(body.split(/\s+/).length / 220));
