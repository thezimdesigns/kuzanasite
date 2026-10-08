import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Megaphone, Search } from "lucide-react";
import { getBranding } from "@/lib/branding";
import { db } from "@/lib/db";
import { getCurrentEdition } from "@/lib/edition";
import { getNews } from "@/lib/news";
import { getActiveAnnouncements, getEditionEvents, getLiveBoard } from "@/lib/programme";
import { computeStatus, dateKey, formatLongDay, startOfDay } from "@/lib/time";
import { AutoRefresh } from "@/components/public/auto-refresh";
import { AlbumCard, EventCard, ExhibitorCard, VideoCard } from "@/components/public/cards";
import { CoverageColumns } from "@/components/public/coverage-columns";
import { HeroSlides } from "@/components/public/hero-slides";
import { InterestPanel } from "@/components/public/interest-panel";
import { StatsBoard } from "@/components/public/stats-board";
import { getPublishedReports } from "@/lib/stats-server";
import { LeadStory, NewsRow } from "@/components/public/news-blocks";
import { PartnerStrip } from "@/components/public/partner-strip";
import { ProgrammeList } from "@/components/public/programme-list";
import { Rail } from "@/components/public/rail";
import { WeekStrip } from "@/components/public/week-strip";
import { cn, EmptyState, Section, SectionTitle } from "@/components/ui";

const SectionLink = ({ href, children }: { href: string; children: string }) => (
  <Link href={href} className="group inline-flex items-center gap-1 text-sm font-semibold text-green-800">
    {children} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
  </Link>
);

export default async function HomePage() {
  const edition = await getCurrentEdition();
  const [board, events, announcements, news, albums, videos, exhibitors, exhibitorCount, partners, branding, mentions, [stats]] = await Promise.all([
    getLiveBoard(),
    getEditionEvents(),
    getActiveAnnouncements(3),
    getNews(4),
    db.photoAlbum.findMany({
      where: { publishStatus: "PUBLISHED" },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 4,
      include: {
        _count: { select: { photos: true } },
        photos: { take: 1, orderBy: { sortOrder: "asc" } },
      },
    }),
    db.video.findMany({
      where: { publishStatus: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { date: "desc" }],
      take: 3,
    }),
    db.exhibitor.findMany({
      where: { status: "APPROVED" },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { category: true, media: { where: { kind: "BOOTH" }, take: 1 } },
    }),
    db.exhibitor.count({ where: { status: "APPROVED" } }),
    db.partner.findMany({
      where: {
        tier: { in: ["CONVENOR", "HOST", "TECHNICAL_PARTNER", "PARTNER"] },
        ...(edition && {
          OR: [{ editionId: edition.id }, { editionId: null }],
        }),
      },
      orderBy: { sortOrder: "asc" },
    }),
    getBranding(),
    db.mediaMention.findMany({
      where: { publishStatus: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: 6,
    }),
    getPublishedReports(1),
  ]);

  const now = new Date();
  const today = dateKey(now);
  const happening = [...board.live, ...board.startingSoon];
  const [leadStory, ...moreNews] = news.posts;

  // "Day 2 of 5" while the edition is running.
  let dayLabel: string | null = null;
  if (edition) {
    const first = dateKey(edition.startDate);
    const last = dateKey(edition.endDate);
    if (today >= first && today <= last) {
      const n = Math.round((startOfDay(today).getTime() - startOfDay(first).getTime()) / 86_400_000) + 1;
      const total = Math.round((startOfDay(last).getTime() - startOfDay(first).getTime()) / 86_400_000) + 1;
      dayLabel = `Day ${n} of ${total}`;
    }
  }

  return (
    <>
      <AutoRefresh seconds={90} />

      {/* Hero: event photos crossfade behind a dark green tint; headline lines rise in. */}
      <section className="relative isolate overflow-hidden text-white">
        <HeroSlides slides={branding.slides} />
        <div className="relative mx-auto flex min-h-[min(80svh,46rem)] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20">
          <h1 className="font-heading leading-[0.9] font-extrabold tracking-[-0.04em]">
            <span className="hero-line text-[clamp(3.5rem,12vw,7rem)]">
              <span style={{ "--i": 0 } as CSSProperties}>KUZANA</span>
            </span>
            <span className="hero-line text-[clamp(2.9rem,10vw,5.75rem)]">
              <span style={{ "--i": 1 } as CSSProperties}>
                SCEEZ <span className="text-orange-bright">{edition?.year ?? 2026}</span>
              </span>
            </span>
          </h1>
          <p className="hero-fade mt-6 max-w-lg font-heading text-lg text-pretty text-white/90 sm:text-xl" style={{ "--i": 0 } as CSSProperties}>
            Towards Vision 2030 through <strong className="font-bold text-white">sport &amp; creative industries</strong>.{" "}
            <span className="font-bold whitespace-nowrap text-orange-bright">#FromTalentToGDP</span>
          </p>
          <p
            className="hero-fade mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-heading font-semibold text-white/90"
            style={{ "--i": 1 } as CSSProperties}
          >
            <span>7–11 October 2026</span>
            <span className="h-4 w-px bg-white/30" aria-hidden />
            <span>Bulawayo, Zimbabwe</span>
            {dayLabel && (
              <>
                <span className="h-4 w-px bg-white/30" aria-hidden />
                <span className="inline-flex items-center gap-2 text-orange-bright">
                  <span className="live-dot inline-block size-2 rounded-full bg-orange-bright" aria-hidden />
                  {dayLabel}
                </span>
              </>
            )}
          </p>
          <div className="hero-fade mt-9 flex flex-col gap-3 sm:flex-row" style={{ "--i": 2 } as CSSProperties}>
            <Link
              href="/live"
              data-fx="kick"
              className="group inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] bg-orange-bright px-6 py-3.5 font-heading font-bold text-green-950 transition-[filter,transform] duration-200 hover:brightness-105 active:scale-[0.98]"
            >
              What&apos;s on now <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/programme/today"
              className="inline-flex items-center justify-center rounded-[var(--radius-control)] border border-white/50 px-6 py-3.5 font-heading font-semibold text-white backdrop-blur-sm transition-[background-color,border-color,transform] duration-200 hover:border-white hover:bg-white/10 active:scale-[0.98]"
            >
              Today&apos;s programme
            </Link>
          </div>
        </div>
      </section>

      {/* Day jump bar */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:gap-6">
          <h2 className="shrink-0 font-heading text-base font-bold text-green-900">Programme by day</h2>
          <WeekStrip selected={today} />
        </div>
      </section>

      {announcements.length > 0 && (
        <Section className="pb-0">
          <ul className="reveal-list grid gap-2 md:grid-cols-2">
            {announcements.map((a) => (
              <li key={a.id}>
                <Link
                  href="/live#announcements"
                  className={cn(
                    "flex h-full items-start gap-3 rounded-[var(--radius-card)] border p-4 transition-[box-shadow,transform] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
                    a.priority === "URGENT" ? "border-danger/40 bg-danger-50" : "border-gold/40 bg-[#fbf5e4]",
                  )}
                >
                  <Megaphone className={cn("mt-0.5 size-5 shrink-0", a.priority === "URGENT" ? "text-danger" : "text-[#8a6a14]")} />
                  <div>
                    <p className="font-heading font-bold">{a.title}</p>
                    {a.body && <p className="line-clamp-2 text-sm text-muted">{a.body}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Now / today */}
      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.35fr]">
          <div className="rounded-[var(--radius-card)] bg-green-950 p-5 text-white sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-2.5 text-xl font-extrabold sm:text-2xl">
                <span className="live-dot inline-block size-2.5 rounded-full bg-orange-bright" aria-hidden /> Happening now
              </h2>
              <Link href="/live" className="text-sm font-semibold text-orange-bright">
                KUZANA Live
              </Link>
            </div>
            {happening.length > 0 ? (
              <ProgrammeList items={happening} nest />
            ) : board.laterToday.length > 0 ? (
              <>
                <p className="mb-3 text-sm text-white/75">Nothing is live right now. Next up today:</p>
                <ProgrammeList items={board.laterToday.slice(0, 3)} />
              </>
            ) : (
              <p className="rounded-[var(--radius-control)] border border-white/15 px-4 py-6 text-center text-white/75">
                Nothing is live right now.{" "}
                <Link href="/programme" className="font-semibold text-white underline">
                  See the full programme
                </Link>
              </p>
            )}
          </div>
          <div>
            <SectionTitle action={<SectionLink href="/programme/today">Full day</SectionLink>}>
              Today, {formatLongDay(now).split(" ").slice(0, 3).join(" ")}
            </SectionTitle>
            {board.today.length > 0 ? (
              <ProgrammeList items={board.today.filter((i) => i.kind === "event").slice(0, 6)} />
            ) : (
              <EmptyState>There are no programme items today.</EmptyState>
            )}
          </div>
        </div>
      </Section>

      {/* The day in numbers */}
      {stats && (
        <section className="bg-green-950 text-white" aria-labelledby="stats-title">
          <Section>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-orange-bright">
                  {stats.dayNumber ? `Day ${stats.dayNumber} · ` : ""}
                  {stats.date}
                </p>
                <h2 id="stats-title" className="mt-1 text-3xl font-extrabold tracking-[-0.02em]">
                  KUZANA in numbers
                </h2>
                {stats.headline && <p className="mt-2 max-w-[60ch] text-white/85">{stats.headline}</p>}
              </div>
              <Link href="/stats" className="text-sm font-semibold text-orange-bright hover:underline">
                Every day&apos;s figures
              </Link>
            </div>
            <StatsBoard groups={stats.groups} tone="dark" />
            {stats.note && <p className="mt-6 max-w-[65ch] text-sm text-white/65">{stats.note}</p>}
          </Section>
        </section>
      )}

            {/* News: one lead story and a column of headlines */}
      {leadStory && (
        <Section>
          <SectionTitle action={<SectionLink href="/news">All news</SectionLink>}>News</SectionTitle>
          <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
            <LeadStory post={leadStory} headingLevel="h3" />
            {moreNews.length > 0 && (
              <div className="divide-y divide-line">
                {moreNews.map((p) => (
                  <NewsRow key={p.id} post={p} />
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Coverage elsewhere */}
      {mentions.length > 0 && (
        <Section>
          <SectionTitle action={<SectionLink href="/media/coverage">All coverage</SectionLink>}>In the media</SectionTitle>
          <CoverageColumns mentions={mentions} />
        </Section>
      )}

      {/* The week: poster-led rail */}
      {events.length > 0 && (
        <Section>
          <SectionTitle action={<SectionLink href="/programme">Full programme</SectionLink>}>The KUZANA week</SectionTitle>
          <Rail label="KUZANA week events">
            {events.map((e) => (
              <div key={e.id} className="w-[78%] shrink-0 sm:w-[42%] lg:w-[calc(25%-0.75rem)]">
                <EventCard event={e} status={computeStatus(e, now)} />
              </div>
            ))}
          </Rail>
        </Section>
      )}

      {/* Exhibitors: search first, then the latest stands */}
      <section className="border-y border-line bg-white">
        <Section>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.6fr]">
            <div>
              <h2 className="text-2xl font-extrabold text-green-900 sm:text-3xl">Find an exhibitor</h2>
              <p className="mt-2 text-muted">
                {exhibitorCount > 0 ? `${exhibitorCount} stands so far, ` : ""}
                from sport and fashion to tech and finance. Search by name, product or stand number.
              </p>
              <form action="/exhibitors" className="mt-5 flex gap-2" role="search">
                <label className="relative flex-1">
                  <span className="sr-only">Search exhibitors</span>
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" />
                  <input
                    name="q"
                    type="search"
                    placeholder="e.g. football kits, B12"
                    className="w-full rounded-[var(--radius-control)] border border-line bg-white py-2.5 pr-3 pl-10 text-base placeholder:text-[#767676] focus:border-green-800 focus:ring-3 focus:ring-green-100 focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-[var(--radius-control)] bg-green-900 px-4 font-heading font-semibold text-white transition-[background-color,transform] hover:bg-green-800 active:scale-[0.98]"
                >
                  Search
                </button>
              </form>
              <div className="mt-4">
                <SectionLink href="/exhibitors">Browse all exhibitors</SectionLink>
              </div>
            </div>
            {exhibitors.length > 0 ? (
              <div className="reveal-list grid content-start gap-3 sm:grid-cols-2">
                {exhibitors.map((x) => (
                  <ExhibitorCard key={x.id} exhibitor={x} />
                ))}
              </div>
            ) : (
              <EmptyState>The directory is filling up as stands are registered at ZITF.</EmptyState>
            )}
          </div>
        </Section>
      </section>

      {/* Media */}
      {(albums.length > 0 || videos.length > 0) && (
        <Section>
          {albums.length > 0 && (
            <>
              <SectionTitle action={<SectionLink href="/gallery">Gallery</SectionLink>}>Latest photos</SectionTitle>
              <div className="reveal-list grid grid-cols-2 gap-3 lg:grid-cols-4">
                {albums.map((a) => (
                  <AlbumCard key={a.id} album={a} />
                ))}
              </div>
            </>
          )}
          {videos.length > 0 && (
            <div className={albums.length ? "mt-12" : ""}>
              <SectionTitle action={<SectionLink href="/videos">Videos</SectionLink>}>Latest videos</SectionTitle>
              <div className="reveal-list grid gap-4 sm:grid-cols-3">
                {videos.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* About: an editorial statement, light, to break up the dark panels */}
      <section className="bg-ivory-pattern border-y border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <h2 className="text-4xl leading-[1] font-extrabold tracking-[-0.03em] text-balance text-green-900 sm:text-5xl lg:text-6xl">
            From <span className="text-orange-dark">talent</span> to <span className="text-orange-dark">GDP</span>.
          </h2>
          <div className="space-y-4 text-lg leading-relaxed text-ink/85">
            <p>
              KUZANA SCEEZ 2026 is an inaugural sport, creative economy and investment platform designed to connect talent, capital, brands, institutions and
              audiences.
            </p>
            <p>
              Talent must move beyond visibility into income, investment, intellectual property, business growth and national economic contribution. KUZANA
              creates a marketplace where sport and creative industries meet capital, infrastructure, policy support, technology and commercial partnerships, in
              support of Zimbabwe&apos;s Vision 2030.
            </p>
          </div>
        </div>
      </section>

      {/* Visitor help */}
      <Section>
        <div className="grid gap-6 md:grid-cols-[0.8fr_1.4fr] md:gap-12">
          <div>
            <h2 className="text-2xl font-extrabold text-green-900 sm:text-3xl">Here for the day?</h2>
            <p className="mt-2 text-muted">Venues, alerts and a direct line to the KUZANA team.</p>
          </div>
          <ul className="reveal-list divide-y divide-line border-y border-line">
            {[
              ["/map", "Venue map", "Every venue in Bulawayo, with directions in Google Maps."],
              ["/plan-your-visit", "Plan your visit", "Tickets, parking and what to know before you arrive."],
              ["/register", "Register as a visitor", "Get alerts for the events you care about."],
              ["/feedback", "Tell us how it went", "Suggestions, compliments, questions, lost and found."],
            ].map(([href, title, text]) => (
              <li key={href}>
                <Link href={href} className="group flex items-center justify-between gap-4 py-4">
                  <span>
                    <span className="block font-heading text-lg font-bold transition-colors group-hover:text-green-800">{title}</span>
                    <span className="block text-sm text-muted">{text}</span>
                  </span>
                  <ArrowUpRight className="size-5 shrink-0 text-orange-dark transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {partners.length > 0 && (
        <section className="border-t border-line bg-white">
          <Section>
            <div className="mb-8 flex items-center justify-center gap-4">
              <h2 className="font-heading text-lg font-bold text-green-900">Convenor, hosts and partners</h2>
              <SectionLink href="/partners">All partners</SectionLink>
            </div>
            <PartnerStrip partners={partners} />
          </Section>
        </section>
      )}

      {/* Stay connected */}
      <section className="relative overflow-hidden bg-green-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid items-start gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
            <div>
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                <h2 className="text-3xl font-extrabold">
                  Stay <span className="text-orange-bright">connected</span>
                </h2>
                <Image src="/brand/lets-do-business.png" alt="Let's do business" width={220} height={60} className="h-auto w-36 lg:hidden" />
              </div>
              <p className="mt-2 max-w-[46ch] text-white/85">Want a part in a future KUZANA edition? Tell us how you&apos;d like to take part.</p>
              <Image src="/brand/lets-do-business.png" alt="" width={220} height={60} className="mt-5 hidden h-auto w-44 lg:block" />
            </div>
            <InterestPanel />
          </div>
        </div>
      </section>
    </>
  );
}
