import "server-only";
import { db } from "@/lib/db";
import type { NewsKind } from "@/lib/generated/prisma/enums";

const published = () => ({
  publishStatus: "PUBLISHED" as const,
  publishedAt: { lte: new Date() },
});

/** Participant stories, interviews and series parts: the "stories" side of the newsroom. */
export const STORY_WHERE = { OR: [{ kind: { in: ["STORY", "INTERVIEW"] as NewsKind[] } }, { seriesId: { not: null } }] };

/** Published posts, newest first; the featured one (if any) leads. `only` narrows to stories or plain updates. */
export async function getNews(take = 20, skip = 0, only?: "stories" | "updates") {
  const scope = only === "stories" ? STORY_WHERE : only === "updates" ? { kind: "UPDATE" as NewsKind, seriesId: null } : {};
  const [lead, rest] = await Promise.all([
    skip === 0
      ? db.newsPost.findFirst({
          where: { ...published(), ...scope, featured: true },
          orderBy: { publishedAt: "desc" },
          include: postCard,
        })
      : null,
    db.newsPost.findMany({
      where: { ...published(), ...scope },
      orderBy: { publishedAt: "desc" },
      take: take + 1,
      skip,
      include: postCard,
    }),
  ]);
  const list = lead ? [lead, ...rest.filter((p) => p.id !== lead.id)] : rest;
  return { posts: list.slice(0, take), hasMore: list.length > take };
}

export async function getNewsPost(slug: string) {
  return db.newsPost.findFirst({
    where: { slug, publishStatus: { in: ["PUBLISHED", "ARCHIVED"] } },
    include: {
      event: { select: { title: true, slug: true } },
      series: true,
      images: { orderBy: { number: "asc" } },
      exhibitors: { include: { exhibitor: { select: { slug: true, name: true, logoKey: true, status: true, category: { select: { name: true } } } } } },
      people: { include: { person: { select: { slug: true, name: true, photoKey: true, jobTitle: true, organisation: true, publishStatus: true } } } },
    },
  });
}

/** What a story card needs beyond the post itself: its series and who it features. */
const postCard = {
  series: { select: { title: true, slug: true } },
  exhibitors: { select: { exhibitor: { select: { name: true } } }, take: 2 },
  people: { select: { person: { select: { name: true } } }, take: 2 },
} as const;

/** Published series with their published parts in order. */
export async function getSeriesList() {
  return db.series.findMany({
    where: { publishStatus: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { posts: { where: published(), orderBy: [{ seriesPart: "asc" }, { publishedAt: "asc" }], include: postCard } },
  });
}

export async function getSeries(slug: string) {
  return db.series.findFirst({
    where: { slug, publishStatus: "PUBLISHED" },
    include: { posts: { where: published(), orderBy: [{ seriesPart: "asc" }, { publishedAt: "asc" }], include: postCard } },
  });
}

/** Stories that feature an exhibitor or a person, for their profile pages. */
export async function getStoriesFeaturing(target: { exhibitorId?: string; personId?: string; eventId?: string }) {
  const or = [
    target.exhibitorId && { exhibitors: { some: { exhibitorId: target.exhibitorId } } },
    target.personId && { people: { some: { personId: target.personId } } },
    target.eventId && { eventId: target.eventId },
  ].filter(Boolean) as object[];
  if (!or.length) return [];
  return db.newsPost.findMany({ where: { ...published(), OR: or }, orderBy: { publishedAt: "desc" }, take: 6, include: postCard });
}

/** "Signal · Part 3" style label, or the kind for a stand-alone story. */
export function storyLabel(p: { kind: NewsKind; seriesPart: number | null; series?: { title: string } | null }) {
  if (p.series) return p.seriesPart ? `${p.series.title} · Part ${p.seriesPart}` : p.series.title;
  return p.kind === "INTERVIEW" ? "Interview" : p.kind === "STORY" ? "Story" : "News";
}

/** Names featured in a story, for a byline like "With Josh M. and IYASA". */
export function featuredNames(p: { exhibitors?: { exhibitor: { name: string } }[]; people?: { person: { name: string } }[] }) {
  return [...(p.people ?? []).map((x) => x.person.name), ...(p.exhibitors ?? []).map((x) => x.exhibitor.name)];
}

export const readingMinutes = (body: string) => Math.max(1, Math.round(body.split(/\s+/).length / 220));
