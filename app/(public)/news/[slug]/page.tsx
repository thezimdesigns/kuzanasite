import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { DEFAULT_SHARE_IMAGE, shareMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { FileDown } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fileUrl, formatBytes } from "@/lib/files";
import { getNewsPost, readingMinutes } from "@/lib/news";
import { formatDate } from "@/lib/time";
import { PhotoCredit } from "@/components/photo-credit";
import { Markdown, storyImageOrder } from "@/components/markdown";
import { StoryLightbox, type LightboxItem } from "@/components/public/lightbox";
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
  const pdf = p.pdfKey ? fileUrl(p.pdfKey, p.pdfName ?? `${p.slug}.pdf`) : null;
  // Every photo in the story, cover first, in reading order: what the lightbox steps through.
  const lightbox: LightboxItem[] = [
    ...(cover ? [{ src: cover, alt: p.coverAlt ?? "", caption: p.coverCaption, credit: p.coverCredit, creditUrl: p.coverCreditUrl }] : []),
    ...storyImageOrder(p.body, p.images).map((i) => ({
      src: fileUrl(i.key)!,
      alt: i.alt ?? i.caption ?? "",
      caption: i.caption,
      credit: i.credit,
      creditUrl: i.creditUrl,
    })),
  ];

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
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-6 sm:px-6 sm:pt-12">
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
          {pdf && (
            <a
              href={pdf}
              className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-green-900/25 bg-white px-4 py-2.5 font-heading text-sm font-bold text-green-900 transition-[border-color,transform] hover:border-green-900 active:scale-[0.98]"
            >
              <FileDown className="size-4 text-orange-dark" aria-hidden /> Download the PDF edition
              {p.pdfSize ? <span className="font-normal text-muted">{formatBytes(p.pdfSize)}</span> : null}
            </a>
          )}
        </div>
      </header>
      <StoryLightbox items={lightbox}>
        {cover && (
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <figure>
              <div className="group relative aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] bg-cream-dark">
                <button type="button" data-lightbox={0} className="absolute inset-0 cursor-zoom-in" aria-label="View the cover photo full size">
                  <Image src={cover} alt={p.coverAlt ?? ""} fill priority sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
                </button>
                {p.coverCredit && <PhotoCredit credit={p.coverCredit} creditUrl={p.coverCreditUrl} />}
              </div>
              {p.coverCaption && <figcaption className="mt-2 text-sm leading-snug text-muted">{p.coverCaption}</figcaption>}
            </figure>
          </div>
        )}
        <Section>
          <div className="text-[1.0625rem] leading-relaxed">
            <Markdown images={p.images} lightboxStart={cover ? 1 : 0}>
              {p.body}
            </Markdown>
          </div>
          {pdf && (
            <a
              href={pdf}
              className="group mt-10 flex items-center gap-4 rounded-[var(--radius-card)] bg-green-900 p-5 text-white transition-colors hover:bg-green-800"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-control)] bg-white/10">
                <FileDown className="size-6 text-orange-bright" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-heading text-lg font-bold">Read the designed edition</span>
                <span className="block text-sm text-white/75">
                  Download the PDF{p.series ? ` of ${p.series.title}${p.seriesPart ? ` Vol. ${p.seriesPart}` : ""}` : ""}
                  {p.pdfSize ? ` · ${formatBytes(p.pdfSize)}` : ""}
                </span>
              </span>
            </a>
          )}
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
      </StoryLightbox>
      {more.length > 0 && (
        <section className="border-t border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
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
