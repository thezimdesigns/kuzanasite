import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Megaphone, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentEdition } from "@/lib/edition";
import { getActiveAnnouncements, getEditionEvents, getLiveBoard } from "@/lib/programme";
import { computeStatus, dateKey, formatLongDay, startOfDay } from "@/lib/time";
import { AutoRefresh } from "@/components/public/auto-refresh";
import { AlbumCard, EventCard, ExhibitorCard, VideoCard } from "@/components/public/cards";
import { InterestForm } from "@/components/public/interest-form";
import { PartnerStrip } from "@/components/public/partner-strip";
import { ProgrammeList } from "@/components/public/programme-list";
import { Rail } from "@/components/public/rail";
import { WeekStrip } from "@/components/public/week-strip";
import { ButtonLink, Card, cn, EmptyState, Section, SectionTitle } from "@/components/ui";

export default async function HomePage() {
  const edition = await getCurrentEdition();
  const [board, events, announcements, albums, videos, exhibitors, exhibitorCount, partners] = await Promise.all([
    getLiveBoard(),
    getEditionEvents(),
    getActiveAnnouncements(3),
    db.photoAlbum.findMany({
      where: { publishStatus: "PUBLISHED" },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 4,
      include: { _count: { select: { photos: true } }, photos: { take: 1, orderBy: { sortOrder: "asc" } } },
    }),
    db.video.findMany({ where: { publishStatus: "PUBLISHED" }, orderBy: [{ featured: "desc" }, { date: "desc" }], take: 3 }),
    db.exhibitor.findMany({
      where: { status: "APPROVED" },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { category: true, media: { where: { kind: "BOOTH" }, take: 1 } },
    }),
    db.exhibitor.count({ where: { status: "APPROVED" } }),
    db.partner.findMany({
      where: { tier: { in: ["HOST", "PARTNER"] }, ...(edition && { OR: [{ editionId: edition.id }, { editionId: null }] }) },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const now = new Date();
  const today = dateKey(now);
  const happening = [...board.live, ...board.startingSoon];

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

      {/* Hero: the focal motion moment. Headline lines rise out of a mask, the collage resolves from blur. */}
      <section className="relative overflow-hidden bg-ivory-pattern">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-8 pb-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pt-14 lg:pb-16">
          <div>
            <h1 className="font-heading leading-[0.9] font-extrabold tracking-[-0.04em] text-green-900">
              <span className="hero-line text-[clamp(3.25rem,11vw,6rem)]">
                <span style={{ "--i": 0 } as CSSProperties}>KUZANA</span>
              </span>
              <span className="hero-line text-[clamp(2.75rem,9.4vw,5rem)]">
                <span style={{ "--i": 1 } as CSSProperties}>
                  SCEEZ <span className="text-orange-dark">{edition?.year ?? 2026}</span>
                </span>
              </span>
            </h1>
            <p className="hero-fade mt-5 max-w-md font-heading text-lg text-pretty sm:text-xl" style={{ "--i": 0 } as CSSProperties}>
              Towards Vision 2030 through <strong className="text-green-900">sport &amp; creative industries</strong>.{" "}
              <span className="font-bold whitespace-nowrap text-orange-dark">#FromTalentToGDP</span>
            </p>
            <p
              className="hero-fade mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-heading font-semibold text-green-900"
              style={{ "--i": 1 } as CSSProperties}
            >
              <span>7–11 October 2026</span>
              <span className="h-4 w-px bg-green-900/25" aria-hidden />
              <span>Bulawayo, Zimbabwe</span>
              {dayLabel && (
                <>
                  <span className="h-4 w-px bg-green-900/25" aria-hidden />
                  <span className="inline-flex items-center gap-2 text-orange-dark">
                    <span className="live-dot inline-block size-2 rounded-full bg-orange" aria-hidden />
                    {dayLabel}
                  </span>
                </>
              )}
            </p>
            <div className="hero-fade mt-8 flex flex-col gap-3 sm:flex-row" style={{ "--i": 2 } as CSSProperties}>
              <ButtonLink href="/live" size="lg">
                What&apos;s on now <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
              </ButtonLink>
              <ButtonLink href="/programme/today" variant="outline" size="lg">
                Today&apos;s programme
              </ButtonLink>
            </div>
          </div>
          <div className="hero-art mx-auto w-full max-w-md lg:max-w-none">
            {/* Pre-sized WebP renditions (public/brand/hero-collage-*.webp) keep the LCP image light. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/hero-collage-1000.webp"
              srcSet="/brand/hero-collage-640.webp 640w, /brand/hero-collage-1000.webp 1000w, /brand/hero-collage-1392.webp 1392w"
              sizes="(min-width: 1024px) 48vw, 90vw"
              width={1392}
              height={964}
              fetchPriority="high"
              alt="Athletes, artists and performers of KUZANA SCEEZ"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Day jump bar */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:gap-6">
          <h2 className="shrink-0 font-heading text-base font-bold text-green-900">Programme by day</h2>
          <WeekStrip selected={today} />
        </div>
      </section>

      {/* Announcements */}
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
                <span className="live-dot inline-block size-2.5 rounded-full bg-orange" aria-hidden /> Happening now
              </h2>
              <Link href="/live" className="text-sm font-semibold text-gold-light underline underline-offset-2">
                KUZANA Live
              </Link>
            </div>
            {happening.length > 0 ? (
              <ProgrammeList items={happening} />
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
            <SectionTitle action={<Link href="/programme/today" className="text-sm font-semibold text-green-800 underline underline-offset-2">Full day</Link>}>
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

      {/* The week: poster-led rail */}
      {events.length > 0 && (
        <Section>
          <SectionTitle action={<Link href="/programme" className="text-sm font-semibold text-green-800 underline underline-offset-2">Full programme</Link>}>
            The KUZANA week
          </SectionTitle>
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
                {exhibitorCount > 0 ? `${exhibitorCount} stands so far, ` : ""}from sport and fashion to tech and finance. Search by name, product or stand number.
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
              <Link href="/exhibitors" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-green-800 underline underline-offset-2">
                Browse all exhibitors <ArrowRight className="size-3.5" />
              </Link>
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
              <SectionTitle action={<Link href="/gallery" className="text-sm font-semibold text-green-800 underline underline-offset-2">Gallery</Link>}>
                Latest photos
              </SectionTitle>
              <div className="reveal-list grid grid-cols-2 gap-3 lg:grid-cols-4">
                {albums.map((a) => (
                  <AlbumCard key={a.id} album={a} />
                ))}
              </div>
            </>
          )}
          {videos.length > 0 && (
            <div className={albums.length ? "mt-12" : ""}>
              <SectionTitle action={<Link href="/videos" className="text-sm font-semibold text-green-800 underline underline-offset-2">Videos</Link>}>
                Latest videos
              </SectionTitle>
              <div className="reveal-list grid gap-4 sm:grid-cols-3">
                {videos.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* About */}
      <section className="bg-green-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:gap-14">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              What is <span className="text-gold-light">KUZANA</span>?
            </h2>
            <p className="mt-4 leading-relaxed text-white/85">
              KUZANA SCEEZ 2026 is an inaugural sport, creative economy and investment platform designed to connect talent,
              capital, brands, institutions and audiences.
            </p>
            <p className="mt-3 leading-relaxed text-white/85">
              The event brings together athletes, creatives, investors, exhibitors, sponsors, policymakers, cultural leaders
              and industry builders to unlock the economic value of sport and creativity.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              From <span className="text-gold-light">talent</span> to <span className="text-gold-light">GDP</span>
            </h2>
            <p className="mt-4 leading-relaxed text-white/85">
              KUZANA is built around a simple idea: talent must move beyond visibility into income, investment, intellectual
              property, business growth and national economic contribution.
            </p>
            <p className="mt-3 leading-relaxed text-white/85">
              The platform supports Zimbabwe&apos;s Vision 2030 ambitions by creating a marketplace where sport and creative
              industries can meet capital, infrastructure, policy support, technology and commercial partnerships.
            </p>
          </div>
        </div>
      </section>

      {/* Visitor help: one list, not three identical cards */}
      <Section>
        <div className="grid gap-6 md:grid-cols-[0.8fr_1.4fr] md:gap-12">
          <div>
            <h2 className="text-2xl font-extrabold text-green-900 sm:text-3xl">Here for the day?</h2>
            <p className="mt-2 text-muted">Venues, alerts and a direct line to the KUZANA team.</p>
          </div>
          <ul className="reveal-list divide-y divide-line border-y border-line">
            {[
              ["/plan-your-visit", "Plan your visit", "Venues, directions and what to know before you arrive."],
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

      {/* Partners */}
      {partners.length > 0 && (
        <section className="border-t border-line bg-white">
          <Section>
            <h2 className="mb-8 text-center font-heading text-lg font-bold text-green-900">Partners and hosts</h2>
            <PartnerStrip partners={partners} />
          </Section>
        </section>
      )}

      {/* Stay connected */}
      <section className="relative overflow-hidden bg-green-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-extrabold">
              Stay <span className="text-gold-light">connected</span>
            </h2>
            <p className="mt-3 text-white/85">
              Be part of the movement driving Zimbabwe&apos;s creative and sporting future. Register your interest for future
              KUZANA editions as a sponsor, exhibitor, speaker, artist, athlete, investor or partner.
            </p>
            <Image src="/brand/lets-do-business.png" alt="Let's do business" width={220} height={60} className="mt-6 h-auto w-48" />
          </div>
          <Card className="p-5 text-ink sm:p-6">
            <InterestForm />
          </Card>
        </div>
      </section>
    </>
  );
}
