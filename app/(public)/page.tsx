import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Megaphone, MessageSquare, Store, UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentEdition } from "@/lib/edition";
import { getActiveAnnouncements, getEditionEvents, getLiveBoard } from "@/lib/programme";
import { computeStatus, formatLongDay } from "@/lib/time";
import { fileUrl } from "@/lib/files";
import { AutoRefresh } from "@/components/public/auto-refresh";
import { AlbumCard, EventCard, ExhibitorCard, VideoCard } from "@/components/public/cards";
import { InterestForm } from "@/components/public/interest-form";
import { ProgrammeList } from "@/components/public/programme-list";
import { ButtonLink, Card, EmptyState, Section, SectionTitle } from "@/components/ui";

export default async function HomePage() {
  const edition = await getCurrentEdition();
  const [board, events, announcements, albums, videos, exhibitors, partners] = await Promise.all([
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
    db.partner.findMany({ where: edition ? { OR: [{ editionId: edition.id }, { editionId: null }] } : {}, orderBy: { sortOrder: "asc" } }),
  ]);

  const now = new Date();
  const happening = [...board.live, ...board.startingSoon];

  return (
    <>
      <AutoRefresh seconds={90} />

      {/* Hero ------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-line bg-ivory-pattern">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-16">
          <div>
            <h1 className="font-heading font-extrabold leading-[0.92] text-green-900">
              <span className="block text-[clamp(3rem,10vw,5.75rem)] tracking-[-0.04em]">KUZANA</span>
              <span className="block text-[clamp(2.5rem,8.4vw,4.75rem)] tracking-[-0.04em]">
                SCEEZ <span className="text-orange">{edition?.year ?? 2026}</span>
              </span>
            </h1>
            <p className="mt-4 font-heading text-lg">
              Towards Vision 2030 through <strong className="text-green-900">Sports &amp;</strong>{" "}
              <strong className="text-orange">Creative Industries</strong>{" "}
              <span className="font-bold whitespace-nowrap">#FromTalentToGDP</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-heading font-semibold">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-5 text-green-900" /> 7–11 October 2026
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-5 text-green-900" /> Bulawayo, Zimbabwe
              </span>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/live" size="lg">
                <span className="live-dot size-2.5 rounded-full bg-white" aria-hidden /> What&apos;s on now
              </ButtonLink>
              <ButtonLink href="/programme/today" variant="secondary" size="lg">
                Today&apos;s programme <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/exhibitors" variant="outline" size="lg">
                Explore exhibitors
              </ButtonLink>
            </div>
          </div>
          <div className="relative hidden aspect-[4/3] lg:block">
            <Image src="/brand/hero-collage.png" alt="Sport and creative industries collage" fill priority sizes="45vw" className="object-contain" />
          </div>
        </div>
      </section>

      {/* Announcements ------------------------------------------------------ */}
      {announcements.length > 0 && (
        <Section className="pb-0">
          <div className="space-y-2">
            {announcements.map((a) => (
              <Link
                key={a.id}
                href="/live#announcements"
                className="flex items-start gap-3 rounded-[var(--radius-card)] border border-gold/40 bg-[#fbf5e4] p-3.5"
              >
                <Megaphone className="mt-0.5 size-5 shrink-0 text-gold" />
                <div>
                  <p className="font-heading font-bold">{a.title}</p>
                  {a.body && <p className="line-clamp-2 text-sm text-muted">{a.body}</p>}
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Live now / Today ---------------------------------------------------- */}
      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionTitle action={<Link href="/live" className="text-sm font-semibold text-green-800 underline">KUZANA Live</Link>}>
              Happening now
            </SectionTitle>
            {happening.length > 0 ? (
              <ProgrammeList items={happening} />
            ) : board.laterToday.length > 0 ? (
              <>
                <p className="mb-3 text-sm text-muted">Nothing is live right now. Up next today:</p>
                <ProgrammeList items={board.laterToday.slice(0, 3)} />
              </>
            ) : (
              <EmptyState>
                Nothing is live right now.{" "}
                <Link href="/programme" className="font-semibold text-green-800 underline">
                  See the full programme
                </Link>
              </EmptyState>
            )}
          </div>
          <div>
            <SectionTitle action={<Link href="/programme/today" className="text-sm font-semibold text-green-800 underline">Full day</Link>}>
              Today · {formatLongDay(now).split(" ").slice(0, 3).join(" ")}
            </SectionTitle>
            {board.today.length > 0 ? (
              <ProgrammeList items={board.today.filter((i) => i.kind === "event").slice(0, 6)} />
            ) : (
              <EmptyState>There are no programme items today.</EmptyState>
            )}
          </div>
        </div>
      </Section>

      {/* The week ------------------------------------------------------------ */}
      {events.length > 0 && (
        <Section>
          <SectionTitle action={<Link href="/programme" className="text-sm font-semibold text-green-800 underline">Programme</Link>}>
            The KUZANA week
          </SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} status={computeStatus(e, now)} />
            ))}
          </div>
        </Section>
      )}

      {/* Exhibitors ------------------------------------------------------------ */}
      <section className="border-y border-line bg-white">
        <Section>
          <SectionTitle action={<Link href="/exhibitors" className="text-sm font-semibold text-green-800 underline">All exhibitors</Link>}>
            Exhibitors
          </SectionTitle>
          {exhibitors.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {exhibitors.map((x) => (
                <ExhibitorCard key={x.id} exhibitor={x} />
              ))}
            </div>
          ) : (
            <EmptyState>
              <Store className="mx-auto mb-2 size-6" />
              The exhibitor directory is filling up as stands are registered at ZITF.
            </EmptyState>
          )}
        </Section>
      </section>

      {/* Media ------------------------------------------------------------ */}
      {(albums.length > 0 || videos.length > 0) && (
        <Section>
          {albums.length > 0 && (
            <>
              <SectionTitle action={<Link href="/gallery" className="text-sm font-semibold text-green-800 underline">Gallery</Link>}>
                Latest photos
              </SectionTitle>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {albums.map((a) => (
                  <AlbumCard key={a.id} album={a} />
                ))}
              </div>
            </>
          )}
          {videos.length > 0 && (
            <div className={albums.length ? "mt-10" : ""}>
              <SectionTitle action={<Link href="/videos" className="text-sm font-semibold text-green-800 underline">Videos</Link>}>
                Latest videos
              </SectionTitle>
              <div className="grid gap-4 sm:grid-cols-3">
                {videos.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* About ------------------------------------------------------------ */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold text-green-900">
              What is <span className="text-orange">KUZANA</span>?
            </h2>
            <p className="mt-3 leading-relaxed">
              KUZANA SCEEZ 2026 is an inaugural sport, creative economy and investment platform designed to connect talent,
              capital, brands, institutions and audiences.
            </p>
            <p className="mt-3 leading-relaxed">
              The event brings together athletes, creatives, investors, exhibitors, sponsors, policymakers, cultural leaders
              and industry builders to unlock the economic value of sport and creativity.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-green-900">
              From <span className="text-orange">TALENT</span> to <span className="text-orange">GDP</span>
            </h2>
            <p className="mt-3 leading-relaxed">
              KUZANA is built around a simple idea: talent must move beyond visibility into income, investment, intellectual
              property, business growth and national economic contribution.
            </p>
            <p className="mt-3 leading-relaxed">
              The platform supports Zimbabwe&apos;s Vision 2030 ambitions by creating a marketplace where sport and creative
              industries can meet capital, infrastructure, policy support, technology and commercial partnerships.
            </p>
          </div>
        </div>
      </section>

      {/* Visitor actions ------------------------------------------------------ */}
      <Section>
        <div className="grid gap-4 md:grid-cols-3">
          <QuickCard href="/plan-your-visit" icon={<MapPin className="size-6" />} title="Plan your visit" text="Venues, directions, tickets and what to know before you arrive." />
          <QuickCard href="/register" icon={<UserPlus className="size-6" />} title="Register as a visitor" text="Get programme updates and alerts for the events you care about." />
          <QuickCard href="/feedback" icon={<MessageSquare className="size-6" />} title="Tell us how it went" text="Suggestions, compliments, questions or lost and found." />
        </div>
      </Section>

      {/* Partners ------------------------------------------------------------ */}
      {partners.length > 0 && (
        <section className="border-t border-line bg-white">
          <Section>
            <h2 className="mb-6 text-center font-heading text-lg font-bold tracking-wide text-green-900 uppercase">Partners / Hosts</h2>
            <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
              {partners.map((p) => {
                const logo = p.logoUrl ?? fileUrl(p.logoKey);
                const content = logo ? (
                  <Image src={logo} alt={p.name} width={160} height={80} className="h-16 w-auto object-contain" />
                ) : (
                  <span className="font-heading font-bold">{p.name}</span>
                );
                return (
                  <li key={p.id} className="flex flex-col items-center gap-1">
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noopener">
                        {content}
                      </a>
                    ) : (
                      content
                    )}
                    {p.caption && <span className="text-xs font-semibold text-muted">{p.caption}</span>}
                  </li>
                );
              })}
            </ul>
          </Section>
        </section>
      )}

      {/* Register interest ------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-green-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
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

function QuickCard({ href, icon, title, text }: { href: string; icon: ReactNode; title: string; text: string }) {
  return (
    <Link href={href} className="group rounded-[var(--radius-card)] border border-line bg-white p-5 transition-colors hover:border-green-800">
      <span className="inline-flex rounded-full bg-orange-50 p-2.5 text-orange">{icon}</span>
      <h3 className="mt-3 font-heading text-lg font-bold group-hover:text-green-800">{title}</h3>
      <p className="mt-1 text-sm text-muted">{text}</p>
    </Link>
  );
}
