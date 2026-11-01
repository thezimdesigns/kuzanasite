import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PenLine } from "lucide-react";
import { fileUrl } from "@/lib/files";
import type { NewsKind } from "@/lib/generated/prisma/enums";
import { featuredNames, storyLabel } from "@/lib/news";
import { formatDate } from "@/lib/time";
import { cn } from "@/components/ui";

export type StoryCardData = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverKey: string | null;
  coverAlt: string | null;
  publishedAt: Date;
  kind: NewsKind;
  seriesPart: number | null;
  series?: { title: string; slug: string } | null;
  exhibitors?: { exhibitor: { name: string } }[];
  people?: { person: { name: string } }[];
};

/**
 * Poster-style story card: cover image (or a branded tile), the series or
 * story label, the headline and who it features. Matches the event cards.
 */
export function StoryCard({ post, className, size = "md" }: { post: StoryCardData; className?: string; size?: "md" | "lg" }) {
  const cover = fileUrl(post.coverKey);
  const names = featuredNames(post);
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-green-800/40 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className={cn("relative overflow-hidden bg-green-900", size === "lg" ? "aspect-[4/3]" : "aspect-[4/3] sm:aspect-[5/4]")}>
        {cover ? (
          <Image
            src={cover}
            alt={post.coverAlt ?? ""}
            fill
            sizes={size === "lg" ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 80vw"}
            className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-end bg-green-900 p-5">
            <span className="pointer-events-none absolute inset-0 bg-[url(/brand/soft-ivory-pattern.png)] bg-[length:260px] opacity-[0.07]" aria-hidden />
            <span className="relative font-heading text-[2.6rem] leading-[0.95] font-extrabold tracking-[-0.03em] text-white/90">
              {post.series ? post.series.title : post.kind === "INTERVIEW" ? "In conversation" : "Stories"}
              {post.seriesPart && <span className="block text-gold-light">Part {post.seriesPart}</span>}
            </span>
          </div>
        )}
        <span className="absolute top-3 left-3 rounded-[var(--radius-badge)] bg-white/95 px-2 py-0.5 text-xs font-bold text-green-900">{storyLabel(post)}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className={cn("font-heading leading-snug font-bold text-balance text-ink", size === "lg" ? "text-2xl" : "text-lg")}>
          <Link href={`/news/${post.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {post.title}
          </Link>
        </h3>
        {size === "lg" && post.excerpt && <p className="mt-2 line-clamp-3 text-pretty text-muted">{post.excerpt}</p>}
        <p className="mt-auto pt-3 text-sm text-muted">
          {names.length > 0 ? (
            <span className="font-semibold text-green-900">With {names.join(", ")}</span>
          ) : (
            <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt)}</time>
          )}
        </p>
      </div>
    </article>
  );
}

type SeriesData = {
  slug: string;
  title: string;
  tagline: string | null;
  author: string | null;
  coverKey: string | null;
  posts: StoryCardData[];
};

/**
 * One series as a band: name, author and pitch on the left, its parts in order
 * on the right. The newest part is called out so returning readers find it.
 */
export function SeriesBand({ series, max = 3, tone = "light" }: { series: SeriesData; max?: number; tone?: "light" | "dark" }) {
  const parts = series.posts.slice(-max);
  const latest = series.posts.at(-1);
  const dark = tone === "dark";
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,2fr)] lg:gap-10">
      <div>
        <p className={cn("text-sm font-bold tracking-[0.08em] uppercase", dark ? "text-orange-bright" : "text-orange-dark")}>A KUZANA series</p>
        <h3 className={cn("mt-1 font-heading text-4xl leading-none font-extrabold tracking-[-0.03em] sm:text-5xl", dark ? "text-white" : "text-green-900")}>
          {series.title}
        </h3>
        {series.author && <p className={cn("mt-2 font-semibold", dark ? "text-white/85" : "text-ink")}>by {series.author}</p>}
        {series.tagline && <p className={cn("mt-3 max-w-[40ch] text-pretty", dark ? "text-white/75" : "text-muted")}>{series.tagline}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          {latest && (
            <Link
              href={`/news/${latest.slug}`}
              className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-orange-bright px-4 py-2.5 font-heading text-sm font-bold text-green-950 transition-[filter,transform] hover:brightness-105 active:scale-[0.98]"
            >
              Read the latest{latest.seriesPart ? `: Part ${latest.seriesPart}` : ""} <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
          <Link
            href={`/series/${series.slug}`}
            className={cn(
              "inline-flex items-center rounded-[var(--radius-control)] border px-4 py-2.5 font-heading text-sm font-semibold transition-colors",
              dark ? "border-white/40 text-white hover:border-white hover:bg-white/10" : "border-green-900/30 text-green-900 hover:border-green-900",
            )}
          >
            All parts ({series.posts.length})
          </Link>
        </div>
      </div>
      {parts.length > 0 ? (
        <div className="rail -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          {parts.map((p) => (
            <StoryCard key={p.id} post={p} className="w-[78%] shrink-0 sm:w-auto" />
          ))}
        </div>
      ) : (
        <p className={cn("self-center", dark ? "text-white/70" : "text-muted")}>The first part is on its way.</p>
      )}
    </div>
  );
}

/** Invitation to past participants to share what happened next. */
export function ShareStoryPanel() {
  return (
    <section className="border-t border-line bg-ivory-pattern">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-extrabold text-green-900">Took part in KUZANA? Tell us what happened next.</h2>
          <p className="mt-1 max-w-[60ch] text-muted">
            Exhibitors, speakers, artists, athletes and partners: share the deals, contacts and projects that came out of the expo. We feature the best in our
            stories.
          </p>
        </div>
        <Link
          href="/stories/share"
          className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-control)] bg-green-900 px-5 py-3 font-heading font-bold text-white transition-[background-color,transform] hover:bg-green-800 active:scale-[0.98]"
        >
          <PenLine className="size-4" aria-hidden /> Share your story <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
