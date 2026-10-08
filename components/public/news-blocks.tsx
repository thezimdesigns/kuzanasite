import Image from "next/image";
import Link from "next/link";
import { fileUrl } from "@/lib/files";
import { formatDate } from "@/lib/time";
import { cn } from "@/components/ui";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverKey: string | null;
  coverAlt: string | null;
  publishedAt: Date;
};

/** The lead story: big image, headline and standfirst side by side on desktop. */
export function LeadStory({ post, headingLevel = "h2" }: { post: Post; headingLevel?: "h2" | "h3" }) {
  const cover = fileUrl(post.coverKey);
  const H = headingLevel;
  return (
    <article className="group relative grid overflow-hidden rounded-[var(--radius-card)] bg-green-950 text-white md:grid-cols-[1.35fr_1fr]">
      <div className="relative aspect-[16/10] overflow-hidden bg-green-900 md:aspect-auto md:min-h-[22rem]">
        {cover && (
          <Image
            src={cover}
            alt={post.coverAlt ?? ""}
            fill
            sizes="(min-width: 768px) 60vw, 100vw"
            className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="flex flex-col justify-end gap-3 p-6 sm:p-8">
        <time dateTime={post.publishedAt.toISOString()} className="text-sm font-semibold text-gold-light">
          {formatDate(post.publishedAt)}
        </time>
        <H className="text-2xl leading-tight font-extrabold text-balance sm:text-3xl">
          <Link href={`/news/${post.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {post.title}
          </Link>
        </H>
        {post.excerpt && <p className="line-clamp-4 text-pretty text-white/80">{post.excerpt}</p>}
        <span className="mt-1 text-sm font-semibold text-orange-bright transition-transform duration-300 group-hover:translate-x-0.5">Read the story</span>
      </div>
    </article>
  );
}

/** Compact headline row with a small thumbnail. */
export function NewsRow({ post, className }: { post: Post; className?: string }) {
  const cover = fileUrl(post.coverKey);
  return (
    <article className={cn("group relative flex gap-4 py-4", className)}>
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-cream-dark sm:h-24 sm:w-36">
        {cover && (
          <Image
            src={cover}
            alt=""
            fill
            sizes="144px"
            className="object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-105"
          />
        )}
      </div>
      <div className="min-w-0">
        <time dateTime={post.publishedAt.toISOString()} className="text-xs font-semibold text-muted">
          {formatDate(post.publishedAt)}
        </time>
        <h3 className="mt-0.5 font-heading text-base leading-snug font-bold text-balance text-ink transition-colors group-hover:text-green-800 sm:text-lg">
          <Link href={`/news/${post.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="mt-1 line-clamp-2 hidden text-sm text-muted sm:block">{post.excerpt}</p>}
      </div>
    </article>
  );
}
