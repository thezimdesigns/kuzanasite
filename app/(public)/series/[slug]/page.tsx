import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fileUrl } from "@/lib/files";
import { getSeries } from "@/lib/news";
import { shareMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { StoryCard } from "@/components/public/story-blocks";
import { ShareButtons } from "@/components/public/share-buttons";
import { BackLink, EmptyState, Section } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/series/[slug]">): Promise<Metadata> {
  const s = await getSeries((await params).slug);
  if (!s) return {};
  return {
    title: `${s.title}: a KUZANA series`,
    description: s.tagline ?? s.description ?? `${s.title}, a KUZANA SCEEZ series${s.author ? ` by ${s.author}` : ""}.`,
    alternates: { canonical: `/series/${s.slug}` },
    ...shareMetadata({ image: fileUrl(s.coverKey ?? s.posts.at(-1)?.coverKey), imageAlt: s.title }),
  };
}

export default async function SeriesPage({ params }: PageProps<"/series/[slug]">) {
  const s = await getSeries((await params).slug);
  if (!s) notFound();
  const cover = fileUrl(s.coverKey);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWorkSeries",
            name: s.title,
            description: s.tagline ?? s.description ?? undefined,
            author: s.author ? { "@type": "Person", name: s.author } : undefined,
            publisher: { "@type": "Organization", name: "KUZANA SCEEZ" },
            url: siteUrl(`/series/${s.slug}`),
            hasPart: s.posts.map((p) => ({ "@type": "Article", headline: p.title, url: siteUrl(`/news/${p.slug}`) })),
          }).replace(/</g, "\u003c"),
        }}
      />
      <header className="relative isolate overflow-hidden bg-green-950 text-white">
        {cover && <Image src={cover} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-30" />}
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <BackLink href="/stories" label="Stories" tone="dark" />
          <p className="text-sm font-bold tracking-[0.08em] text-orange-bright uppercase">A KUZANA series</p>
          <h1 className="mt-1 font-heading text-[clamp(3rem,10vw,6rem)] leading-[0.9] font-extrabold tracking-[-0.04em]">{s.title}</h1>
          {s.author && <p className="mt-3 text-lg font-semibold text-white/90">by {s.author}</p>}
          {s.tagline && <p className="mt-4 max-w-[55ch] text-lg text-pretty text-white/80">{s.tagline}</p>}
          {s.description && <p className="mt-3 max-w-[65ch] text-pretty whitespace-pre-line text-white/70">{s.description}</p>}
        </div>
      </header>
      <Section>
        {s.posts.length ? (
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {s.posts.map((p) => (
              <li key={p.id}>
                <StoryCard post={p} />
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState>The first part is on its way.</EmptyState>
        )}
        <div className="mt-10 border-t border-line pt-6">
          <ShareButtons title={`${s.title}: a KUZANA series`} path={`/series/${s.slug}`} />
        </div>
      </Section>
    </>
  );
}
