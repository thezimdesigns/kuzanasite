import type { Metadata } from "next";
import { shareMetadata } from "@/lib/seo";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Download, MessageCircleQuestion, ExternalLink, FileDown, MapPin, Phone, Navigation, Route as RouteIcon, Ticket, UserCheck } from "lucide-react";
import { db } from "@/lib/db";
import { fileUrl, formatBytes } from "@/lib/files";
import { DOCUMENT_TYPE_LABELS, PARTICIPANT_ROLE_LABELS, SESSION_TYPE_LABELS } from "@/lib/options";
import { venueMapUrl } from "@/lib/programme";
import { computeStatus, dateKey, formatRange, formatTimes, formatLongDay } from "@/lib/time";
import { AlbumCard, VideoCard } from "@/components/public/cards";
import { ProgrammeBanner } from "@/components/public/programme-list";
import { PushOptIn } from "@/components/public/push-opt-in";
import { RatingForm } from "@/components/public/rating-form";
import { ShareButtons } from "@/components/public/share-buttons";
import { StatusBadge } from "@/components/public/status-badge";
import { StreamPlayer } from "@/components/public/stream-player";
import { Markdown } from "@/components/markdown";
import { Avatar } from "@/components/public/avatar";
import { BackLink, Badge, ButtonLink, Card, cn, Section, SectionTitle } from "@/components/ui";

async function getEvent(slug: string) {
  return db.event.findFirst({
    where: { slug, publishStatus: { in: ["PUBLISHED", "ARCHIVED"] } },
    include: {
      venue: true,
      category: true,
      edition: true,
      participants: {
        include: { person: true },
        orderBy: { sortOrder: "asc" },
      },
      sessions: {
        where: { publishStatus: "PUBLISHED" },
        orderBy: [{ startsAt: "asc" }, { sortOrder: "asc" }],
        include: {
          participants: {
            include: { person: true },
            orderBy: { sortOrder: "asc" },
          },
          documents: { where: { publishStatus: "PUBLISHED" } },
          videos: { where: { publishStatus: "PUBLISHED" } },
          streams: {
            where: { active: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: { id: true, label: true, url: true },
          },
        },
      },
      documents: {
        where: { publishStatus: "PUBLISHED", sessionId: null },
        orderBy: { date: "desc" },
      },
      albums: {
        where: { publishStatus: "PUBLISHED" },
        include: {
          _count: { select: { photos: true } },
          photos: { take: 1, orderBy: { sortOrder: "asc" } },
        },
      },
      videos: {
        where: { publishStatus: "PUBLISHED", sessionId: null },
        orderBy: { date: "desc" },
      },
      streams: {
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, label: true, url: true },
      },
      tickets: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      _count: { select: { routes: true } },
      announcements: {
        where: {
          publishStatus: "PUBLISHED",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return {};
  const image = fileUrl(event.posterKey ?? event.imageKey);
  return {
    title: event.title,
    description: event.summary ?? `${event.title}: ${formatRange(event.startsAt, event.endsAt, event.timeTbc, event.dailyHours)}`,
    alternates: { canonical: `/events/${event.slug}` },
    ...shareMetadata({ image, imageAlt: `${event.title} poster` }),
  };
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const now = new Date();
  const status = computeStatus(event, now);
  const image = fileUrl(event.posterKey ?? event.imageKey);
  const when = formatRange(event.startsAt, event.endsAt, event.timeTbc, event.dailyHours);
  const shareTitle = `KUZANA ${event.title}: ${when}${event.venue ? ` at ${event.venue.name}` : ""}`;

  // Group sessions by day for multi-day conferences.
  const sessionDays = new Map<string, typeof event.sessions>();
  for (const s of event.sessions) {
    const k = dateKey(s.startsAt);
    sessionDays.set(k, [...(sessionDays.get(k) ?? []), s]);
  }

  return (
    <>
      {event.bannerKey && <ProgrammeBanner banner={{ wide: event.bannerKey, mobile: event.bannerMobileKey }} priority className="border-b border-line" />}
      <header className="border-b border-line bg-ivory-pattern">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-12 md:grid-cols-[1.4fr_1fr]">
          <div>
            <BackLink href="/programme" label="Programme" />
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {event.category && <Badge tone="green">{event.category.name}</Badge>}
              <StatusBadge status={status} />
            </div>
            <h1 className="text-[2rem] leading-[1.05] font-extrabold tracking-[-0.025em] text-balance text-green-900 sm:text-5xl">{event.title}</h1>
            {event.statusNote && <p className="mt-3 font-semibold text-danger">{event.statusNote}</p>}
            {event.summary && <p className="mt-3 text-lg text-muted">{event.summary}</p>}
            <dl className="mt-5 space-y-2 font-semibold">
              <div className="flex items-center gap-2">
                <dt className="sr-only">When</dt>
                <CalendarDays className="size-5 text-green-900" />
                <dd>{when}</dd>
              </div>
              {event.venue && (
                <div className="flex items-center gap-2">
                  <dt className="sr-only">Where</dt>
                  <MapPin className="size-5 text-orange-dark" />
                  <dd>
                    <Link href={`/venues/${event.venue.slug}`} className="underline underline-offset-2">
                      {[event.room, event.venue.name].filter(Boolean).join(", ")}
                    </Link>
                  </dd>
                  {venueMapUrl(event.venue) && (
                    <a
                      href={venueMapUrl(event.venue)!}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1 rounded-[var(--radius-control)] border border-line bg-white px-2 py-1 text-xs font-semibold text-green-900 transition-colors hover:border-green-800"
                      aria-label={`Open ${event.venue.name} in Google Maps`}
                    >
                      <Navigation className="size-3.5" aria-hidden /> Map
                    </a>
                  )}
                </div>
              )}
              {event.contact && (
                <div className="flex items-center gap-2">
                  <dt className="sr-only">Contact</dt>
                  <Phone className="size-5 text-green-900" />
                  <dd className="font-normal">{event.contact}</dd>
                </div>
              )}
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              {event.tickets.length > 0 ? (
                <TicketList tickets={event.tickets} defaultUrl={event.ticketUrl} />
              ) : (
                event.ticketRequired && (
                  <TicketBox
                    icon={<Ticket className="size-5" />}
                    title={`Ticket required${event.ticketPrice ? ` · ${event.ticketPrice}` : ""}`}
                    url={event.ticketUrl}
                    cta="Get tickets"
                  />
                )
              )}
              {event.registrationRequired && (
                <TicketBox icon={<UserCheck className="size-5" />} title="Registration required" url={event.registrationUrl} cta="Register" />
              )}
              {!event.ticketRequired && !event.tickets.length && !event.registrationRequired && <Badge tone="green">No ticket or registration needed</Badge>}
            </div>
            {event.programmePdfKey && (
              <ButtonLink
                href={fileUrl(event.programmePdfKey, event.programmePdfName ?? `${event.title} programme.pdf`)!}
                prefetch={false}
                size="lg"
                className="mt-6 w-full sm:w-auto"
              >
                <FileDown className="size-5" /> Download detailed programme (PDF)
                {event.programmePdfSize ? <span className="font-normal text-white/80">{formatBytes(event.programmePdfSize)}</span> : null}
              </ButtonLink>
            )}
            {event.isConference && (
              <ButtonLink
                href={`/events/${event.slug}/qa`}
                variant={status === "LIVE" ? "primary" : "outline"}
                size="lg"
                className="mt-3 w-full sm:mr-3 sm:w-auto"
              >
                <MessageCircleQuestion className="size-5" /> Ask a question
              </ButtonLink>
            )}
            {event._count.routes > 0 && (
              <ButtonLink href={`/events/${event.slug}/route`} variant="outline" size="lg" className="mt-3 w-full sm:ml-3 sm:w-auto">
                <RouteIcon className="size-5" /> Route map
              </ButtonLink>
            )}
            <div className="mt-6 flex flex-col gap-4">
              {status !== "COMPLETED" && <PushOptIn eventId={event.id} />}
              <ShareButtons title={shareTitle} path={`/events/${event.slug}`} />
            </div>
          </div>
          {image && (
            <a
              href={image}
              target="_blank"
              rel="noopener"
              className="hero-art group relative block aspect-[4/5] max-h-[32rem] overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-[var(--shadow-lift)]"
              aria-label={`Open the ${event.title} poster full size`}
            >
              <Image
                src={image}
                alt={`${event.title} poster`}
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-contain transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.02]"
                priority
              />
            </a>
          )}
        </div>
      </header>

      {event.announcements.length > 0 && (
        <Section className="pb-0">
          <div className="space-y-2">
            {event.announcements.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "rounded-[var(--radius-control)] border p-3.5",
                  a.priority === "URGENT" ? "border-danger bg-danger-50" : "border-gold bg-[#fbf5e4]",
                )}
              >
                <p className="font-heading font-bold">{a.title}</p>
                {a.body && <p className="text-sm whitespace-pre-line">{a.body}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-10">
          {event.streams.length > 0 && status !== "CANCELLED" && (
            <div id="watch" className="scroll-mt-24">
              <SectionTitle>{status === "LIVE" ? "Watch live" : "Live stream"}</SectionTitle>
              {now < event.startsAt && <p className="-mt-2 mb-3 text-sm text-muted">The stream starts with the event: {when}.</p>}
              <StreamPlayer streams={event.streams} title={event.title} live={status === "LIVE"} />
            </div>
          )}

          {event.description && (
            <div>
              <SectionTitle>About</SectionTitle>
              <Markdown>{event.description}</Markdown>
            </div>
          )}

          {event.sessions.length > 0 && (
            <div>
              <SectionTitle>Agenda</SectionTitle>
              <div className="space-y-8">
                {[...sessionDays.entries()].map(([day, sessions]) => (
                  <div key={day}>
                    {sessionDays.size > 1 && <h3 className="mb-3 font-heading font-bold text-green-900">{formatLongDay(sessions[0].startsAt)}</h3>}
                    <ol className="relative space-y-3 border-l-2 border-line pl-5">
                      {sessions.map((s) => {
                        const sStatus = computeStatus(s, now);
                        return (
                          <li key={s.id} id={`session-${s.id}`} className="relative scroll-mt-24">
                            <span
                              className={cn(
                                "absolute top-1.5 -left-[1.6rem] size-3 rounded-full border-2 border-white",
                                sStatus === "LIVE" ? "bg-orange" : sStatus === "COMPLETED" ? "bg-line" : "bg-green-900",
                              )}
                            />
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                              <span className="font-heading text-sm font-bold text-green-900">{formatTimes(s.startsAt, s.endsAt)}</span>
                              <h4 className="font-heading font-bold">{s.title}</h4>
                              <StatusBadge status={sStatus} hideUpcoming />
                            </div>
                            <p className="text-xs text-muted">
                              {SESSION_TYPE_LABELS[s.type]}
                              {s.room && ` · ${s.room}`}
                            </p>
                            {s.posterKey && (
                              <a
                                href={fileUrl(s.posterKey)!}
                                target="_blank"
                                rel="noopener"
                                className="group mt-2 block w-32 overflow-hidden rounded-[var(--radius-control)] border border-line"
                                aria-label={`Open the ${s.title} poster`}
                              >
                                <span className="relative block aspect-[4/5]">
                                  <Image
                                    src={fileUrl(s.posterKey)!}
                                    alt={`${s.title} poster`}
                                    fill
                                    sizes="128px"
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                </span>
                              </a>
                            )}
                            {s.description && <p className="mt-1 text-sm whitespace-pre-line">{s.description}</p>}
                            {s.participants.length > 0 && (
                              <ul className="mt-2 flex flex-wrap gap-2">
                                {s.participants.map((p) => (
                                  <li key={p.id}>
                                    <Link
                                      href={`/speakers/${p.person.slug}`}
                                      className="inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-line bg-white py-1 pr-3 pl-1 text-sm transition-colors hover:border-green-800"
                                    >
                                      <Avatar name={p.person.name} photoKey={p.person.photoKey} size={28} />
                                      <span>
                                        <strong>{p.person.name}</strong>
                                        <span className="text-muted"> · {PARTICIPANT_ROLE_LABELS[p.role]}</span>
                                      </span>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {s.streams.length > 0 && sStatus !== "CANCELLED" && (
                              <details id={`watch-${s.id}`} open={sStatus === "LIVE"} className="mt-2 scroll-mt-24">
                                <summary className="cursor-pointer text-xs font-semibold text-orange-deeper">
                                  {sStatus === "LIVE" ? "Watch live" : "Live stream"} ({s.streams.length})
                                </summary>
                                <div className="mt-2">
                                  <StreamPlayer streams={s.streams} title={s.title} live={sStatus === "LIVE"} />
                                </div>
                              </details>
                            )}
                            {event.isConference && ["PANEL_DISCUSSION", "KEYNOTE", "PRESENTATION", "WORKSHOP", "CLOSING_SESSION"].includes(s.type) && sStatus !== "COMPLETED" && (
                              <Link
                                href={`/events/${event.slug}/qa?session=${s.id}`}
                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-deeper hover:underline"
                              >
                                <MessageCircleQuestion className="size-3.5" aria-hidden /> Ask about this session
                              </Link>
                            )}
                            {now >= s.startsAt && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-xs font-semibold text-green-800">Rate this session</summary>
                                <div className="mt-2">
                                  <RatingForm sessionId={s.id} label="How was this session?" compact />
                                </div>
                              </details>
                            )}
                            {(s.documents.length > 0 || s.videos.length > 0) && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {s.documents.map((d) => (
                                  <a
                                    key={d.id}
                                    href={fileUrl(d.key, d.fileName) ?? `/media/documents/${d.slug}`}
                                    className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-900"
                                  >
                                    <Download className="size-3.5" /> {d.title}
                                  </a>
                                ))}
                                {s.videos.map((v) => (
                                  <a
                                    key={v.id}
                                    href={`https://www.youtube.com/watch?v=${v.youtubeId}`}
                                    target="_blank"
                                    rel="noopener"
                                    className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-deeper"
                                  >
                                    <ExternalLink className="size-3.5" /> Watch: {v.title}
                                  </a>
                                ))}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.albums.length > 0 && (
            <div>
              <SectionTitle>Photos</SectionTitle>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {event.albums.map((a) => (
                  <AlbumCard key={a.id} album={a} />
                ))}
              </div>
            </div>
          )}

          {event.videos.length > 0 && (
            <div>
              <SectionTitle>Videos</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                {event.videos.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          {event.participants.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 font-heading text-lg font-bold text-green-900">Featuring</h2>
              <ul className="space-y-3">
                {event.participants.map((p) => (
                  <li key={p.id}>
                    <Link href={`/speakers/${p.person.slug}`} className="flex items-center gap-3 hover:text-green-800">
                      <Avatar name={p.person.name} photoKey={p.person.photoKey} size={44} />
                      <span>
                        <span className="block font-semibold">{p.person.name}</span>
                        <span className="block text-xs text-muted">
                          {PARTICIPANT_ROLE_LABELS[p.role]}
                          {p.person.organisation && ` · ${p.person.organisation}`}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {event.documents.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 font-heading text-lg font-bold text-green-900">Downloads</h2>
              <ul className="space-y-2">
                {event.documents.map((d) => (
                  <li key={d.id}>
                    <Link href={`/media/documents/${d.slug}`} className="flex items-start gap-2 text-sm hover:text-green-800">
                      <Download className="mt-0.5 size-4 shrink-0 text-orange-dark" />
                      <span>
                        <span className="font-semibold">{d.title}</span>
                        <span className="block text-xs text-muted">
                          {DOCUMENT_TYPE_LABELS[d.type]}
                          {d.size ? ` · ${formatBytes(d.size)}` : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {now >= event.startsAt && status !== "CANCELLED" && status !== "POSTPONED" && (
            <Card className="p-5">
              <RatingForm eventId={event.id} />
            </Card>
          )}

          <Card className="p-5">
            <h2 className="font-heading text-lg font-bold text-green-900">Feedback</h2>
            <p className="mt-1 text-sm text-muted">Questions, compliments or something we should fix?</p>
            <ButtonLink href={`/feedback?event=${event.id}`} variant="outline" size="sm" className="mt-3">
              Send feedback
            </ButtonLink>
          </Card>
        </aside>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: event.title,
            startDate: event.startsAt.toISOString(),
            ...(event.endsAt && { endDate: event.endsAt.toISOString() }),
            eventStatus:
              status === "CANCELLED"
                ? "https://schema.org/EventCancelled"
                : status === "POSTPONED"
                  ? "https://schema.org/EventPostponed"
                  : "https://schema.org/EventScheduled",
            ...(event.venue && {
              location: {
                "@type": "Place",
                name: event.venue.name,
                address: event.venue.address ?? "Bulawayo, Zimbabwe",
              },
            }),
            description: event.summary ?? undefined,
            organizer: { "@type": "Organization", name: "KUZANA SCEEZ" },
          }).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}

function TicketBox({ icon, title, url, cta }: { icon: ReactNode; title: string; url: string | null; cta: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-control)] border border-line bg-white px-3.5 py-2.5">
      <span className="text-orange-dark">{icon}</span>
      <span className="text-sm font-semibold">{title}</span>
      {url && (
        <a href={url} target="_blank" rel="noopener" className="text-sm font-bold text-green-800 underline">
          {cta}
        </a>
      )}
    </div>
  );
}

/** Ticket types with prices; each links to its own shop page or the event's ticket link. */
function TicketList({
  tickets,
  defaultUrl,
}: {
  tickets: { id: string; name: string; price: string; note: string | null; url: string | null; soldOut: boolean }[];
  defaultUrl: string | null;
}) {
  return (
    <div className="w-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-white sm:max-w-md">
      <p className="flex items-center gap-2 border-b border-line bg-cream px-3.5 py-2 text-sm font-semibold text-green-900">
        <Ticket className="size-4 text-orange-dark" aria-hidden /> Tickets
      </p>
      <ul className="divide-y divide-line">
        {tickets.map((t) => {
          const href = t.url ?? defaultUrl;
          return (
            <li key={t.id} className="flex items-center gap-3 px-3.5 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{t.name}</span>
                {t.note && <span className="block text-xs text-muted">{t.note}</span>}
              </span>
              <span className={cn("font-heading font-bold whitespace-nowrap tabular-nums", t.soldOut ? "text-muted line-through" : "text-green-900")}>{t.price}</span>
              {t.soldOut ? (
                <Badge tone="orange">Sold out</Badge>
              ) : href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener"
                  className="rounded-[var(--radius-control)] bg-orange-dark px-3 py-1.5 text-sm font-bold whitespace-nowrap text-white transition-colors hover:bg-orange-deeper"
                >
                  Buy
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
