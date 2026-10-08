import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";
import { getNewsPost, readingMinutes } from "@/lib/news";
import { formatDate } from "@/lib/time";
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
    openGraph: { type: "article", publishedTime: p.publishedAt.toISOString(), ...(cover && { images: [cover] }) },
  };
}

export default async function NewsArticle({ params }: PageProps<"/news/[slug]">) {
  const p = await getNewsPost((await params).slug);
  if (!p) notFound();
  const cover = fileUrl(p.coverKey);
  const more = await db.newsPost.findMany({
    where: { publishStatus: "PUBLISHED", publishedAt: { lte: new Date() }, id: { not: p.id } },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  return (
    <article>
      <header className="bg-ivory-pattern">
        <div className="mx-auto max-w-3xl px-4 pt-8 pb-6 sm:px-6 sm:pt-12">
          <BackLink href="/news" label="News" />
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
          <figure className="relative -mt-0 aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] bg-cream-dark">
            <Image src={cover} alt={p.coverAlt ?? ""} fill priority sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
          </figure>
        </div>
      )}
      <Section className="max-w-3xl">
        <div className="text-[1.0625rem] leading-relaxed">
          <Markdown>{p.body}</Markdown>
        </div>
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
            <h2 className="mb-2 text-xl font-extrabold text-green-900">More news</h2>
            {more.map((m) => (
              <NewsRow key={m.id} post={m} className="border-b border-line last:border-0" />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
