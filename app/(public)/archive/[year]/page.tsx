import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { editionDates, getSiteState } from "@/lib/edition";
import { fileUrl } from "@/lib/files";
import { getPublishedReports } from "@/lib/stats-server";
import { computeStatus, dateKey, formatLongDay } from "@/lib/time";
import { AlbumCard, EventCard, ExhibitorCard, VideoCard } from "@/components/public/cards";
import { CoverageColumns } from "@/components/public/coverage-columns";
import { DocumentList } from "@/components/public/document-list";
import { StatsExplorer } from "@/components/public/stats-explorer";
import { StoryCard } from "@/components/public/story-blocks";
import { PartnerStrip } from "@/components/public/partner-strip";
import { partnersOfEdition } from "@/lib/partners";
import { BackLink, Section, SectionTitle } from "@/components/ui";

const live = { publishStatus: { in: ["PUBLISHED" as const, "ARCHIVED" as const] } };

async function getEdition(year: number) {
  if (!Number.isInteger(year)) return null;
  return db.edition.findUnique({
    where: { year },
    include: {
      events: { where: live, include: { venue: true, category: true }, orderBy: [{ startsAt: "asc" }, { sortOrder: "asc" }] },
      albums: {
        where: live,
        include: { _count: { select: { photos: true } }, photos: { take: 1, orderBy: { sortOrder: "asc" } } },
        orderBy: { date: "asc" },
      },
      videos: { where: live, orderBy: { date: "desc" } },
      documents: { where: live, orderBy: { date: "desc" }, include: { event: { select: { title: true } } } },
      exhibitors: {
        where: { status: "APPROVED" },
        orderBy: { name: "asc" },
        include: { category: true, media: { where: { kind: "BOOTH" }, take: 1 } },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps<"/archive/[year]">): Promise<Metadata> {
  const edition = await getEdition(Number((await params).year));
  return edition
    ? {
        title: `${edition.name} in review`,
        description: `${edition.name}, ${editionDates(edition)}: the programme, speeches, stories, photos, videos and exhibitors of the Sport & Creative Economy Expo of Zimbabwe.`,
        alternates: { canonical: `/archive/${edition.year}` },
      }
    : {};
}

export default async function EditionReviewPage({ params }: PageProps<"/archive/[year]">) {
  const edition = await getEdition(Number((await params).year));
  if (!edition) notFound();
  const now = new Date();
  const ended = dateKey(edition.endDate) < dateKey(now);
  const exhibitorIds = edition.exhibitors.map((x) => x.id);
  const eventIds = edition.events.map((e) => e.id);

  const [reports, stories, mentions, { next }, partners] = await Promise.all([
    getPublishedReports(undefined, edition),
    db.newsPost.findMany({
      where: {
        publishStatus: "PUBLISHED",
        publishedAt: { lte: now },
        AND: [
          { OR: [{ kind: { in: ["STORY", "INTERVIEW"] } }, { seriesId: { not: null } }] },
          { OR: [{ editionId: edition.id }, { eventId: { in: eventIds } }, { exhibitors: { some: { exhibitorId: { in: exhibitorIds } } } }] },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 6,
      include: {
        series: { select: { title: true, slug: true } },
        exhibitors: { select: { exhibitor: { select: { name: true } } }, take: 2 },
        people: { select: { person: { select: { name: true } } }, take: 2 },
      },
    }),
    db.mediaMention.findMany({
      where: { publishStatus: "PUBLISHED", OR: [{ publishedAt: null }, { publishedAt: { lte: new Date(edition.endDate.getTime() + 60 * 86_400_000) } }] },
      orderBy: [{ featured: "desc" }, { publishedAt: { sort: "desc", nulls: "last" } }],
      take: 6,
    }),
    getSiteState(),
    db.partner.findMany({ where: partnersOfEdition(edition.id), orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);

  const days = [...reports].reverse().map((r) => ({
    key: r.key,
    label: r.dayNumber ? `Day ${r.dayNumber}` : r.short,
    date: r.date,
    short: r.short,
    headline: r.headline,
    note: r.note,
    groups: r.groups,
  }));
  // Programme grouped by the day each event starts.
  const byDay = new Map<string, typeof edition.events>();
  for (const e of edition.events) byDay.set(dateKey(e.startsAt), [...(byDay.get(dateKey(e.startsAt)) ?? []), e]);
  const speeches = edition.documents.filter((d) => d.type === "SPEECH");
  const otherDocs = edition.documents.filter((d) => d.type !== "SPEECH");
  const heroPoster = edition.events.find((e) => e.featured && (e.posterKey || e.imageKey)) ?? edition.events.find((e) => e.posterKey || e.imageKey);
  const heroImage = fileUrl(heroPoster?.imageKey ?? heroPoster?.posterKey);
  const invite = next && next.year > edition.year ? next : null;

  return (
    <>
      <header className="relative isolate overflow-hidden bg-green-950 text-white">
        {heroImage && <Image src={heroImage} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-25" />}
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
          <BackLink href="/archive" label="Archive" tone="dark" />
          <p className="text-sm font-bold tracking-[0.1em] text-orange-bright uppercase">{ended ? "In review" : "This edition"}</p>
          <h1 className="mt-1 font-heading text-[clamp(2.75rem,9vw,5.5rem)] leading-[0.92] font-extrabold tracking-[-0.04em]">
            KUZANA SCEEZ <span className="text-orange-bright">{edition.year}</span>
          </h1>
          <p className="mt-4 font-heading text-lg font-semibold text-white/90">{editionDates(edition)} · Bulawayo, Zimbabwe</p>
          {edition.theme && <p className="mt-2 max-w-[55ch] text-pretty text-white/75">{edition.theme}</p>}
          <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-6 border-t border-white/15 pt-6 sm:grid-cols-4">
            {(
              [
                [edition.events.length, "events"],
                [edition.exhibitors.length, "exhibitors"],
                [speeches.length, "speeches"],
                [edition.albums.length + edition.videos.length, "albums & videos"],
              ] as const
            )
              .filter(([n]) => n > 0)
              .map(([n, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="font-heading text-4xl leading-none font-extrabold text-orange-bright tabular-nums">{n}</dd>
                  <dd className="mt-1 text-sm font-semibold text-white/70">{label}</dd>
                </div>
              ))}
          </dl>
          {/* Jump links: the page is long. */}
          <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-2 text-sm font-semibold">
            {[
              days.length > 0 && ["#numbers", "In numbers"],
              edition.events.length > 0 && ["#programme", "Programme"],
              speeches.length > 0 && ["#speeches", "Speeches"],
              stories.length > 0 && ["#stories", "Stories"],
              mentions.length > 0 && ["#media", "In the media"],
              edition.exhibitors.length > 0 && ["#exhibitors", "Exhibitors"],
            ]
              .filter((x): x is [string, string] => !!x)
              .map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-[var(--radius-control)] bg-white/10 px-3 py-1.5 ring-1 ring-white/20 transition-colors hover:bg-white/20"
                >
                  {label}
                </a>
              ))}
          </nav>
        </div>
      </header>

      {days.length > 0 && (
        <Section id="numbers">
          <SectionTitle>The week in numbers</SectionTitle>
          <StatsExplorer days={days} initial={days.length > 1 ? "week" : days[0].key} />
        </Section>
      )}

      {edition.events.length > 0 && (
        <Section id="programme" className="border-t border-line">
          <SectionTitle>Programme</SectionTitle>
          <div className="space-y-10">
            {[...byDay.entries()].map(([key, events]) => (
              <div key={key}>
                <h3 className="mb-4 font-heading text-sm font-bold tracking-[0.08em] text-muted uppercase">{formatLongDay(events[0].startsAt)}</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {events.map((e) => (
                    <EventCard key={e.id} event={e} status={computeStatus(e, now)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {speeches.length > 0 && (
        <Section id="speeches" className="border-t border-line">
          <SectionTitle>Speeches</SectionTitle>
          <DocumentList docs={speeches} />
        </Section>
      )}

      {stories.length > 0 && (
        <Section id="stories" className="border-t border-line">
          <SectionTitle
            action={
              <Link href="/stories" className="text-sm font-semibold text-green-800 hover:underline">
                All stories
              </Link>
            }
          >
            Stories from {edition.year}
          </SectionTitle>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((p) => (
              <StoryCard key={p.id} post={p} />
            ))}
          </div>
        </Section>
      )}

      {mentions.length > 0 && (
        <Section id="media" className="border-t border-line">
          <SectionTitle
            action={
              <Link href="/media/coverage" className="text-sm font-semibold text-green-800 hover:underline">
                All coverage
              </Link>
            }
          >
            In the media
          </SectionTitle>
          <CoverageColumns mentions={mentions} />
        </Section>
      )}

      {(edition.albums.length > 0 || edition.videos.length > 0) && (
        <Section className="border-t border-line">
          {edition.albums.length > 0 && (
            <>
              <SectionTitle>Photos</SectionTitle>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {edition.albums.map((a) => (
                  <AlbumCard key={a.id} album={a} />
                ))}
              </div>
            </>
          )}
          {edition.videos.length > 0 && (
            <div className={edition.albums.length ? "mt-10" : ""}>
              <SectionTitle>Videos</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {edition.videos.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {otherDocs.length > 0 && (
        <Section className="border-t border-line">
          <SectionTitle>Documents</SectionTitle>
          <DocumentList docs={otherDocs} />
        </Section>
      )}

      {edition.exhibitors.length > 0 && (
        <Section id="exhibitors" className="border-t border-line">
          <SectionTitle
            action={
              <Link href="/exhibitors" className="text-sm font-semibold text-green-800 hover:underline">
                Search the directory
              </Link>
            }
          >
            Exhibitors ({edition.exhibitors.length})
          </SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {edition.exhibitors.slice(0, 9).map((x) => (
              <ExhibitorCard key={x.id} exhibitor={x} />
            ))}
          </div>
        </Section>
      )}

      {partners.length > 0 && (
        <section className="border-t border-line bg-white">
          <Section>
            <h2 className="mb-8 text-center font-heading text-lg font-bold text-green-900">Partners of KUZANA SCEEZ {edition.year}</h2>
            <PartnerStrip partners={partners} allHref={`/partners?year=${edition.year}`} />
          </Section>
        </section>
      )}

      {invite && (
        <section className="bg-green-900 text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold tracking-[0.08em] text-orange-bright uppercase">{editionDates(invite)}</p>
              <h2 className="mt-1 font-heading text-3xl font-extrabold">See you at KUZANA SCEEZ {invite.year}</h2>
            </div>
            <Link
              href="/take-part"
              className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-control)] bg-orange-bright px-5 py-3 font-heading font-bold text-green-950 transition-[filter,transform] hover:brightness-105 active:scale-[0.98]"
            >
              Take part in {invite.year} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
