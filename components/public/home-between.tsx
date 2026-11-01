import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarPlus } from "lucide-react";
import type { Edition } from "@/lib/generated/prisma/client";
import { getBranding } from "@/lib/branding";
import { db } from "@/lib/db";
import { editionDates, editionJsonLd, getPortal } from "@/lib/edition";
import { fileUrl } from "@/lib/files";
import { getNews, getSeriesList, storyLabel } from "@/lib/news";
import { siteUrl } from "@/lib/site";
import { dateKey, startOfDay } from "@/lib/time";
import { CoverageColumns } from "@/components/public/coverage-columns";
import { HeroSlides } from "@/components/public/hero-slides";
import { NewsRow } from "@/components/public/news-blocks";
import { PartnerStrip } from "@/components/public/partner-strip";
import { SeriesBand, StoryCard } from "@/components/public/story-blocks";
import { TakePartGrid } from "@/components/public/take-part";
import { Section, SectionTitle } from "@/components/ui";

const SectionLink = ({ href, children }: { href: string; children: string }) => (
  <Link href={href} className="group inline-flex items-center gap-1 text-sm font-semibold text-green-800">
    {children} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
  </Link>
);

/**
 * The homepage between editions. Roughly 70% is what is happening now and the
 * next edition (stories, series, updates, taking part); the last edition is
 * kept as a compact proof band near the end.
 */
export async function BetweenHome({ next, past }: { next: Edition | null; past: Edition | null }) {
  const [branding, portal, series, stories, updates, mentions, partners, pastEvents, pastCounts] = await Promise.all([
    getBranding(),
    getPortal(),
    getSeriesList(),
    getNews(7, 0, "stories"),
    getNews(4, 0, "updates"),
    db.mediaMention.findMany({
      where: { publishStatus: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: 3,
    }),
    db.partner.findMany({ where: { tier: { in: ["CONVENOR", "HOST", "TECHNICAL_PARTNER", "PARTNER"] } }, orderBy: { sortOrder: "asc" } }),
    past
      ? db.event.findMany({
          where: { editionId: past.id, publishStatus: "PUBLISHED", OR: [{ posterKey: { not: null } }, { imageKey: { not: null } }] },
          orderBy: [{ featured: "desc" }, { startsAt: "asc" }],
          take: 6,
          select: { slug: true, title: true, posterKey: true, imageKey: true },
        })
      : [],
    past
      ? Promise.all([
          db.event.count({ where: { editionId: past.id, publishStatus: "PUBLISHED" } }),
          db.exhibitor.count({ where: { editionId: past.id, status: "APPROVED" } }),
          db.person.count({ where: { publishStatus: "PUBLISHED", OR: [{ eventRoles: { some: {} } }, { sessionRoles: { some: {} } }] } }),
          db.document.count({ where: { editionId: past.id, publishStatus: "PUBLISHED", type: "SPEECH" } }),
        ])
      : null,
  ]);

  const nowReading = stories.posts[0] ?? null;
  // Series parts show in the series band; the participant grid is for stand-alone stories.
  const standalone = stories.posts.filter((p) => !p.series && p.id !== nowReading?.id).slice(0, 3);
  const leadSeries = series.find((s) => s.posts.length > 0) ?? series[0] ?? null;
  const daysToGo = next
    ? Math.max(0, Math.round((startOfDay(dateKey(next.startDate)).getTime() - startOfDay(dateKey(new Date())).getTime()) / 86_400_000))
    : null;
  const readingCover = fileUrl(nowReading?.coverKey);

  return (
    <>
      {next && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(editionJsonLd(next, siteUrl("/"))).replace(/</g, "\\u003c") }} />
      )}

      {/* Hero: the next edition on the left, what to read now on the right. */}
      <section className="relative isolate overflow-hidden text-white">
        <HeroSlides slides={branding.slides} />
        <div className="relative mx-auto grid min-h-[min(78svh,44rem)] max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="hero-fade font-heading text-sm font-bold tracking-[0.12em] text-orange-bright uppercase" style={{ "--i": 0 } as React.CSSProperties}>
              {next ? "Next edition" : "Sport & Creative Economy Expo of Zimbabwe"}
            </p>
            <h1 className="mt-2 font-heading leading-[0.9] font-extrabold tracking-[-0.04em]">
              <span className="hero-line text-[clamp(3.25rem,11vw,6.5rem)]">
                <span style={{ "--i": 0 } as React.CSSProperties}>KUZANA</span>
              </span>
              <span className="hero-line text-[clamp(2.7rem,9vw,5.25rem)]">
                <span style={{ "--i": 1 } as React.CSSProperties}>SCEEZ {next && <span className="text-orange-bright">{next.year}</span>}</span>
              </span>
            </h1>
            {next && (
              <p
                className="hero-fade mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-heading text-lg font-semibold text-white/95"
                style={{ "--i": 1 } as React.CSSProperties}
              >
                <span>{editionDates(next)}</span>
                <span className="h-4 w-px bg-white/30" aria-hidden />
                <span>Bulawayo, Zimbabwe</span>
                {daysToGo !== null && daysToGo > 0 && (
                  <>
                    <span className="h-4 w-px bg-white/30" aria-hidden />
                    <span className="text-orange-bright tabular-nums">{daysToGo} days to go</span>
                  </>
                )}
              </p>
            )}
            <p className="hero-fade mt-3 max-w-lg text-pretty text-white/85" style={{ "--i": 2 } as React.CSSProperties}>
              {next?.theme ?? "Towards Vision 2030 through sport & creative industries"}.{" "}
              <span className="font-bold whitespace-nowrap text-orange-bright">#FromTalentToGDP</span>
            </p>
            <div className="hero-fade mt-8 flex flex-col gap-3 sm:flex-row" style={{ "--i": 2 } as React.CSSProperties}>
              <Link
                href="/take-part"
                data-fx="kick"
                className="group inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] bg-orange-bright px-6 py-3.5 font-heading font-bold text-green-950 transition-[filter,transform] duration-200 hover:brightness-105 active:scale-[0.98]"
              >
                Take part{next ? ` in ${next.year}` : ""} <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              {next && (
                <a
                  href="/save-the-date.ics"
                  className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border border-white/50 px-6 py-3.5 font-heading font-semibold text-white backdrop-blur-sm transition-[background-color,border-color,transform] duration-200 hover:border-white hover:bg-white/10 active:scale-[0.98]"
                >
                  <CalendarPlus className="size-4" aria-hidden /> Save the date
                </a>
              )}
            </div>
            <a
              href={portal.url}
              target="_blank"
              rel="noopener"
              className="hero-fade mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline"
              style={{ "--i": 3 } as React.CSSProperties}
            >
              Exhibitors &amp; sponsors: {portal.open ? "apply on the KUZANA Portal" : "KUZANA Portal"} <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          </div>

          {nowReading && (
            <Link
              href={`/news/${nowReading.slug}`}
              className="hero-fade group relative block overflow-hidden rounded-[var(--radius-card)] bg-green-950/70 ring-1 ring-white/15 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1"
              style={{ "--i": 3 } as React.CSSProperties}
            >
              {readingCover && (
                <span className="relative block aspect-[16/10] overflow-hidden">
                  <Image
                    src={readingCover}
                    alt={nowReading.coverAlt ?? ""}
                    fill
                    sizes="(min-width: 1024px) 36vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </span>
              )}
              <span className="block p-5">
                <span className="text-xs font-bold tracking-[0.1em] text-orange-bright uppercase">Now reading · {storyLabel(nowReading)}</span>
                <span className="mt-2 block font-heading text-2xl leading-tight font-extrabold text-balance">{nowReading.title}</span>
                {nowReading.excerpt && <span className="mt-2 line-clamp-2 block text-sm text-white/75">{nowReading.excerpt}</span>}
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-orange-bright">
                  Read <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* Series, Signal first */}
      {leadSeries && (
        <section className="border-b border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <SeriesBand series={leadSeries} />
          </div>
        </section>
      )}

      {/* Participant stories */}
      <Section>
        <SectionTitle action={<SectionLink href="/stories">All stories</SectionLink>}>Where are they now?</SectionTitle>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {standalone.map((p) => (
            <StoryCard key={p.id} post={p} />
          ))}
          <div
            className={`flex flex-col justify-between rounded-[var(--radius-card)] bg-green-900 p-6 text-white ${standalone.length === 0 ? "md:col-span-2 lg:col-span-4 lg:flex-row lg:items-center lg:gap-8" : ""}`}
          >
            <div>
              <p className="font-heading text-2xl leading-tight font-extrabold text-balance">
                Took part{past ? ` in ${past.year}` : ""}? Tell us what happened next.
              </p>
              <p className="mt-2 text-sm text-white/75">The deals, contacts and projects that came out of KUZANA. We feature participant stories all year.</p>
            </div>
            <Link
              href="/stories/share"
              className="mt-5 inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-orange-bright px-4 py-2.5 font-heading font-bold text-green-950 transition-[filter,transform] hover:brightness-105 active:scale-[0.98] lg:mt-0"
            >
              Share your story <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </Section>

      {/* Updates and coverage */}
      {(updates.posts.length > 0 || mentions.length > 0) && (
        <Section className="border-t border-line">
          {updates.posts.length > 0 && (
            <>
              <SectionTitle action={<SectionLink href="/news">All updates</SectionLink>}>Updates</SectionTitle>
              <div className="grid gap-x-10 md:grid-cols-2">
                {updates.posts.map((p) => (
                  <NewsRow key={p.id} post={p} className="border-b border-line" />
                ))}
              </div>
            </>
          )}
          {mentions.length > 0 && (
            <div className={updates.posts.length ? "mt-12" : ""}>
              <SectionTitle action={<SectionLink href="/media/coverage">All coverage</SectionLink>}>In the media</SectionTitle>
              <CoverageColumns mentions={mentions} />
            </div>
          )}
        </Section>
      )}

      {/* Take part in the next edition */}
      <section className="bg-green-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold tracking-[0.08em] text-orange-bright uppercase">{next ? editionDates(next) : "Next edition"}</p>
              <h2 className="mt-1 font-heading text-3xl font-extrabold text-balance sm:text-4xl">Be part of KUZANA SCEEZ{next ? ` ${next.year}` : ""}</h2>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
              <a href={portal.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-orange-bright hover:underline">
                Exhibitor &amp; sponsor portal <ArrowUpRight className="size-4" aria-hidden />
              </a>
              <Link href="/register" className="inline-flex items-center gap-1 text-white/85 hover:text-white hover:underline">
                Get updates by email or WhatsApp <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
          <TakePartGrid portal={portal} year={next?.year ?? null} tone="dark" />
        </div>
      </section>

      {/* The last edition, as proof: compact. */}
      {past && (
        <section className="border-b border-line bg-cream-dark">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold tracking-[0.08em] text-orange-dark uppercase">{editionDates(past)}</p>
              <h2 className="mt-1 font-heading text-3xl font-extrabold text-green-900">KUZANA SCEEZ {past.year}</h2>
              {pastCounts && (
                <dl className="mt-5 grid grid-cols-4 gap-3 border-t border-green-900/15 pt-5">
                  {(
                    [
                      [pastCounts[0], "events"],
                      [pastCounts[1], "exhibitors"],
                      [pastCounts[2], "speakers & guests"],
                      [pastCounts[3], "speeches"],
                    ] as const
                  )
                    .filter(([n]) => n > 0)
                    .map(([n, label]) => (
                      <div key={label}>
                        <dt className="sr-only">{label}</dt>
                        <dd className="font-heading text-3xl leading-none font-extrabold text-green-900 tabular-nums sm:text-4xl">{n}</dd>
                        <dd className="mt-1 text-xs font-semibold text-muted">{label}</dd>
                      </div>
                    ))}
                </dl>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link
                  href={`/archive/${past.year}`}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-green-900 px-4 py-2.5 font-heading text-sm font-bold text-white transition-colors hover:bg-green-800"
                >
                  Relive {past.year} <ArrowRight className="size-4" aria-hidden />
                </Link>
                <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
                  <Link href="/programme" className="text-green-800 hover:underline">
                    Programme
                  </Link>
                  <Link href="/exhibitors" className="text-green-800 hover:underline">
                    Exhibitors
                  </Link>
                  <Link href="/media/speeches" className="text-green-800 hover:underline">
                    Speeches
                  </Link>
                  <Link href="/stats" className="text-green-800 hover:underline">
                    In numbers
                  </Link>
                </span>
              </div>
            </div>
            {pastEvents.length > 0 && (
              <ul className="rail -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
                {pastEvents.map((e) => (
                  <li key={e.slug} className="w-[40%] shrink-0 sm:w-auto">
                    <Link
                      href={`/events/${e.slug}`}
                      className="group relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-control)] bg-green-900"
                      title={e.title}
                    >
                      <Image
                        src={fileUrl(e.posterKey ?? e.imageKey)!}
                        alt={`${e.title} poster`}
                        fill
                        sizes="(min-width: 640px) 18vw, 40vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {partners.length > 0 && (
        <section className="bg-white">
          <Section>
            <div className="mb-8 flex items-center justify-center gap-4">
              <h2 className="font-heading text-lg font-bold text-green-900">Convenor, hosts and partners</h2>
              <SectionLink href="/partners">All partners</SectionLink>
            </div>
            <PartnerStrip partners={partners} />
          </Section>
        </section>
      )}
    </>
  );
}
