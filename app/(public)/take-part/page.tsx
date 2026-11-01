import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarPlus } from "lucide-react";
import { db } from "@/lib/db";
import { editionDates, editionJsonLd, getPortal, getSiteState } from "@/lib/edition";
import { getNews } from "@/lib/news";
import { siteUrl } from "@/lib/site";
import { Markdown } from "@/components/markdown";
import { StoryCard } from "@/components/public/story-blocks";
import { TakePartGrid } from "@/components/public/take-part";
import { PageHeader, Section, SectionTitle } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const { next } = await getSiteState();
  return {
    title: next ? `Take part in KUZANA SCEEZ ${next.year}` : "Take part in KUZANA SCEEZ",
    description: next
      ? `Exhibit, sponsor, speak, perform, compete or partner at KUZANA SCEEZ ${next.year}, ${editionDates(next)} in Bulawayo, Zimbabwe.`
      : "Exhibit, sponsor, speak, perform, compete or partner at the next KUZANA SCEEZ in Bulawayo, Zimbabwe.",
    alternates: { canonical: "/take-part" },
  };
}

/** Shown until the team writes its own "What happens next" (Admin › Pages, slug "take-part"). */
const DEFAULT_STEPS = [
  ["Now", "Register your interest. We keep you posted as plans for the next edition take shape."],
  ["Applications open", "Exhibitor and sponsor applications open on the KUZANA Portal. We tell everyone who registered interest."],
  ["Programme announced", "Conferences, sport, music and the exhibition programme go live on this site."],
  ["Expo week", "Bulawayo hosts the Sport & Creative Economy Expo of Zimbabwe."],
];

export default async function TakePartPage() {
  const [{ next, past }, portal, page, { posts }] = await Promise.all([
    getSiteState(),
    getPortal(),
    db.page.findUnique({ where: { slug: "take-part" } }),
    getNews(3, 0, "stories"),
  ]);
  const proof = past
    ? await Promise.all([
        db.event.count({ where: { editionId: past.id, publishStatus: "PUBLISHED" } }),
        db.exhibitor.count({ where: { editionId: past.id, status: "APPROVED" } }),
        db.person.count({ where: { publishStatus: "PUBLISHED", OR: [{ eventRoles: { some: {} } }, { sessionRoles: { some: {} } }] } }),
        db.mediaMention.count({ where: { publishStatus: "PUBLISHED" } }),
      ])
    : null;

  return (
    <>
      {next && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(editionJsonLd(next, siteUrl("/take-part"))).replace(/</g, "\\u003c") }}
        />
      )}
      <PageHeader
        title={next ? `Take part in KUZANA SCEEZ ${next.year}` : "Take part in KUZANA SCEEZ"}
        intro={
          next
            ? `${editionDates(next)} · Bulawayo, Zimbabwe.${next.theme ? ` ${next.theme}.` : ""} Choose how you'd like to be part of it.`
            : "Choose how you'd like to be part of the next edition."
        }
      >
        <div className="flex flex-wrap gap-2">
          <a
            href={portal.url}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-green-900 px-4 py-2.5 font-heading text-sm font-bold text-white transition-colors hover:bg-green-800"
          >
            Exhibitor &amp; sponsor portal <ArrowUpRight className="size-4" aria-hidden />
          </a>
          {next && (
            <a
              href="/save-the-date.ics"
              className="inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-green-900/30 bg-white px-4 py-2.5 font-heading text-sm font-semibold text-green-900 transition-colors hover:border-green-900"
            >
              <CalendarPlus className="size-4" aria-hidden /> Save the date
            </a>
          )}
        </div>
        {!portal.open && (
          <p className="mt-3 text-sm text-muted">
            Portal applications for {next?.year ?? "the next edition"} are not open yet. Register interest below and we&apos;ll tell you when they open.
          </p>
        )}
      </PageHeader>

      <Section>
        <SectionTitle>How would you like to take part?</SectionTitle>
        <TakePartGrid portal={portal} year={next?.year ?? null} />
      </Section>

      {past && proof && (
        <section className="bg-green-950 text-white">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <p className="text-sm font-bold tracking-[0.08em] text-orange-bright uppercase">Why KUZANA</p>
            <h2 className="mt-1 max-w-[24ch] font-heading text-3xl font-extrabold text-balance sm:text-4xl">What {past.year} brought together</h2>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/15 pt-8 sm:grid-cols-4">
              {(
                [
                  [proof[0], "events across the week"],
                  [proof[1], "exhibitors"],
                  [proof[2], "speakers and guests"],
                  [proof[3], "media reports"],
                ] as const
              )
                .filter(([n]) => n > 0)
                .map(([n, label]) => (
                  <div key={label}>
                    <dt className="sr-only">{label}</dt>
                    <dd className="font-heading text-5xl leading-none font-extrabold tracking-[-0.03em] text-orange-bright tabular-nums">{n}</dd>
                    <dd className="mt-2 text-sm font-semibold text-white/75">{label}</dd>
                  </div>
                ))}
            </dl>
            <Link href={`/archive/${past.year}`} className="mt-8 inline-flex items-center gap-1 font-semibold text-orange-bright hover:underline">
              See KUZANA SCEEZ {past.year} in review <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <Section>
          <SectionTitle
            action={
              <Link href="/stories" className="text-sm font-semibold text-green-800 hover:underline">
                All stories
              </Link>
            }
          >
            From the people who took part
          </SectionTitle>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <StoryCard key={p.id} post={p} />
            ))}
          </div>
        </Section>
      )}

      <Section className="border-t border-line">
        <SectionTitle>What happens next</SectionTitle>
        {page?.body ? (
          <div className="max-w-3xl">
            <Markdown>{page.body}</Markdown>
          </div>
        ) : (
          <ol className="grid gap-4 sm:grid-cols-4">
            {DEFAULT_STEPS.map(([title, text], i) => (
              <li key={title} className="border-t-2 border-orange pt-3">
                <span className="font-heading text-sm font-bold text-orange-dark tabular-nums">0{i + 1}</span>
                <p className="mt-1 font-heading text-lg font-bold text-green-900">{i === 3 && next ? editionDates(next) : title}</p>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </>
  );
}
