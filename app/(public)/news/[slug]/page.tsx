import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { DEFAULT_SHARE_IMAGE, shareMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";
import { getNewsPost, readingMinutes } from "@/lib/news";
import { formatDate } from "@/lib/time";
import { ImageCredit } from "@/components/image-credit";
import { Markdown } from "@/components/markdown";
import { NewsRow } from "@/components/public/news-blocks";
import { ShareButtons } from "@/components/public/share-buttons";
import { BackLink, Section } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/news/[slug]">): Promise<Metadata> {
  const p = await getNewsPost((await params).slug);
  if (!p) return {};
  const cover = fileUrl(p.coverKey);
  return {
    title: p.title,
    description: p.excerpt ?? undefined,
    alternates: { canonical: `/news/${p.slug}` },
    ...shareMetadata({ image: cover, imageAlt: p.coverAlt ?? p.title, type: "article", publishedTime: p.publishedAt.toISOString() }),
  };
}

export default async function NewsArticle({ params }: PageProps<"/news/[slug]">) {
  const p = await getNewsPost((await params).slug);
  if (!p) notFound();
  const cover = fileUrl(p.coverKey);
  const published = { publishStatus: "PUBLISHED" as const, publishedAt: { lte: new Date() } };
  const [more, parts] = await Promise.all([
    db.newsPost.findMany({
      where: { ...published, id: { not: p.id }, ...(p.seriesId ? { seriesId: { not: p.seriesId } } : {}) },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    // The whole series in order, for "Part 3 of 6" and previous/next links.
    p.seriesId
      ? db.newsPost.findMany({
          where: { ...published, seriesId: p.seriesId },
          orderBy: [{ seriesPart: "asc" }, { publishedAt: "asc" }],
          select: { id: true, slug: true, title: true, seriesPart: true },
        })
      : Promise.resolve([]),
  ]);
  const at = parts.findIndex((x) => x.id === p.id);
  const prev = at > 0 ? parts[at - 1] : null;
  const next = at >= 0 && at < parts.length - 1 ? parts[at + 1] : null;
  const exhibitors = p.exhibitors.map((x) => x.exhibitor).filter((x) => x.status === "APPROVED");
  const people = p.people.map((x) => x.person).filter((x) => x.publishStatus === "PUBLISHED");
  const isStory = p.kind !== "UPDATE" || !!p.series;

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": isStory ? "Article" : "NewsArticle",
            headline: p.title,
            description: p.excerpt ?? undefined,
            datePublished: p.publishedAt.toISOString(),
            dateModified: p.updatedAt.toISOString(),
            image: [siteUrl(cover ?? DEFAULT_SHARE_IMAGE.url)],
            author: p.author ? { "@type": "Person", name: p.author } : { "@type": "Organization", name: "KUZANA SCEEZ" },
            publisher: { "@type": "Organization", name: "KUZANA SCEEZ", logo: { "@type": "ImageObject", url: siteUrl("/brand/kuzana-icon.png") } },
            mainEntityOfPage: siteUrl(`/news/${p.slug}`),
            isPartOf: p.series ? { "@type": "CreativeWorkSeries", name: p.series.title, url: siteUrl(`/series/${p.series.slug}`) } : undefined,
            about: [...people.map((x) => ({ "@type": "Person", name: x.name })), ...exhibitors.map((x) => ({ "@type": "Organization", name: x.name }))],
          }).replace(/</g, "\\u003c"),
        }}
      />
      <header className="bg-ivory-pattern">
        <div className="mx-auto max-w-3xl px-4 pt-8 pb-6 sm:px-6 sm:pt-12">
          {p.series ? (
            <BackLink href={`/series/${p.series.slug}`} label={p.series.title} />
          ) : (
            <BackLink href={isStory ? "/stories" : "/news"} label={isStory ? "Stories" : "News"} />
          )}
          {(p.series || isStory) && (
            <p className="mb-2 text-sm font-bold tracking-[0.08em] text-orange-dark uppercase">
              {p.series
                ? `${p.series.title}${p.seriesPart ? ` · Part ${p.seriesPart}${parts.length > 1 ? ` of ${parts.length}` : ""}` : ""}`
                : p.kind === "INTERVIEW"
                  ? "Interview"
                  : "Story"}
            </p>
          )}
          <h1 className="text-[2rem] leading-[1.08] font-extrabold tracking-[-0.025em] text-balance text-green-900 sm:text-5xl">{p.title}</h1>
          {p.excerpt && <p className="mt-4 text-lg text-pretty text-muted sm:text-xl">{p.excerpt}</p>}
          <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <time dateTime={p.publishedAt.toISOString()} className="font-semibold text-green-900">
              {formatDate(p.publishedAt)}
            </time>
            {p.author && <span>{p.author}</span>}
            <span>{readingMinutes(p.body)} min read</span>
          </p>
        </div>
      </header>
      {cover && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <figure>
            <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] bg-cream-dark">
              <Image src={cover} alt={p.coverAlt ?? ""} fill priority sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
            </div>
            <ImageCredit caption={p.coverCaption} credit={p.coverCredit} creditUrl={p.coverCreditUrl} />
          </figure>
        </div>
      )}
      <Section className="max-w-3xl">
        <div className="text-[1.0625rem] leading-relaxed">
          <Markdown images={p.images}>{p.body}</Markdown>
        </div>
        {(people.length > 0 || exhibitors.length > 0) && (
          <aside className="mt-10" aria-label="Featured in this story">
            <h2 className="mb-3 font-heading text-sm font-bold tracking-[0.08em] text-muted uppercase">Featured in this story</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {people.map((x) => (
                <li key={x.slug}>
                  <FeaturedLink
                    href={`/speakers/${x.slug}`}
                    image={fileUrl(x.photoKey)}
                    title={x.name}
                    sub={[x.jobTitle, x.organisation].filter(Boolean).join(", ")}
                    round
                  />
                </li>
              ))}
              {exhibitors.map((x) => (
                <li key={x.slug}>
                  <FeaturedLink href={`/exhibitors/${x.slug}`} image={fileUrl(x.logoKey)} title={x.name} sub={x.category?.name ?? "Exhibitor"} />
                </li>
              ))}
            </ul>
          </aside>
        )}
        {(prev || next) && (
          <nav aria-label={`${p.series?.title} parts`} className="mt-10 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/news/${prev.slug}`}
                className="group rounded-[var(--radius-card)] border border-line bg-white p-4 transition-colors hover:border-green-800"
              >
                <span className="text-xs font-bold tracking-wide text-muted uppercase">← Part {prev.seriesPart ?? at}</span>
                <span className="mt-1 block font-heading font-bold text-ink group-hover:text-green-900">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={`/news/${next.slug}`}
                className="group rounded-[var(--radius-card)] border border-line bg-white p-4 text-right transition-colors hover:border-green-800"
              >
                <span className="text-xs font-bold tracking-wide text-orange-dark uppercase">Next: Part {next.seriesPart ?? at + 2} →</span>
                <span className="mt-1 block font-heading font-bold text-ink group-hover:text-green-900">{next.title}</span>
              </Link>
            )}
          </nav>
        )}
        {p.event && (
          <p className="mt-8 rounded-[var(--radius-control)] bg-green-100 px-4 py-3 text-sm">
            Related event:{" "}
            <Link href={`/events/${p.event.slug}`} className="font-semibold text-green-900 underline underline-offset-2">
              {p.event.title}
            </Link>
          </p>
        )}
        <div className="mt-8 border-t border-line pt-6">
          <ShareButtons title={p.title} path={`/news/${p.slug}`} />
        </div>
      </Section>
      {more.length > 0 && (
        <section className="border-t border-line bg-white">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
            <h2 className="mb-2 text-xl font-extrabold text-green-900">More from KUZANA</h2>
            {more.map((m) => (
              <NewsRow key={m.id} post={m} className="border-b border-line last:border-0" />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function FeaturedLink({ href, image, title, sub, round }: { href: string; image: string | null; title: string; sub: string; round?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-white p-3 transition-colors hover:border-green-800">
      <span className={`relative size-12 shrink-0 overflow-hidden bg-cream-dark ${round ? "rounded-full" : "rounded-[var(--radius-control)]"}`}>
        {image && <Image src={image} alt="" fill sizes="48px" className={round ? "object-cover" : "object-contain p-1"} />}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-heading font-bold text-ink">{title}</span>
        {sub && <span className="block truncate text-sm text-muted">{sub}</span>}
      </span>
    </Link>
  );
}
