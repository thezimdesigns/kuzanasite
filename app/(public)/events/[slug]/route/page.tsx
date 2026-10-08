import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navigation } from "lucide-react";
import { db } from "@/lib/db";
import { googleMapsUrl } from "@/lib/geo";
import { formatRange } from "@/lib/time";
import { RouteMap } from "@/components/map/route-map";
import { ShareButtons } from "@/components/public/share-buttons";
import { EmptyState, PageHeader, Section } from "@/components/ui";

async function getEvent(slug: string) {
  return db.event.findFirst({
    where: { slug, publishStatus: { in: ["PUBLISHED", "ARCHIVED"] } },
    include: {
      venue: true,
      routes: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { points: { orderBy: { sortOrder: "asc" } } } },
    },
  });
}

export async function generateMetadata({ params }: PageProps<"/events/[slug]/route">): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  return e ? { title: `${e.title} route map`, description: `Course map for ${e.title}: start, turning points and finish.` } : {};
}

const KIND = { START: "Start", TURN: "Turning point", WAYPOINT: "Route", FINISH: "Finish" } as const;

export default async function EventRoutePage({ params }: PageProps<"/events/[slug]/route">) {
  const event = await getEvent((await params).slug);
  if (!event) notFound();
  const routes = event.routes.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    distanceKm: r.distanceKm,
    points: r.points.map((p) => ({ id: p.id, kind: p.kind, label: p.label, lat: p.latitude, lng: p.longitude })),
  }));

  return (
    <>
      <PageHeader
        back={{ href: `/events/${event.slug}`, label: event.title }}
        title="Route map"
        intro={`${formatRange(event.startsAt, event.endsAt, event.timeTbc, event.dailyHours)}${event.venue ? `, from ${event.venue.name}` : ""}. Choose a distance to see its course.`}
      />
      <Section>
        {routes.length === 0 ? (
          <EmptyState>The route will be published here soon.</EmptyState>
        ) : (
          <>
            <RouteMap routes={routes} />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {routes.map((r) => {
                const key = r.points.filter((p) => p.kind !== "WAYPOINT");
                return (
                  <section key={r.id}>
                    <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
                      <span className="size-3 rounded-full" style={{ background: r.color }} aria-hidden /> {r.name}
                    </h2>
                    <ol className="mt-2 divide-y divide-line border-y border-line">
                      {key.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                          <span>
                            <span className="font-semibold">{KIND[p.kind]}</span>
                            {p.label && <span className="text-muted">: {p.label}</span>}
                          </span>
                          <a
                            href={googleMapsUrl(p.lat, p.lng)}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-orange-dark"
                            aria-label={`${r.name} ${KIND[p.kind]} in Google Maps`}
                          >
                            <Navigation className="size-3.5" aria-hidden /> Map
                          </a>
                        </li>
                      ))}
                    </ol>
                  </section>
                );
              })}
            </div>
            <div className="mt-10 border-t border-line pt-6">
              <ShareButtons title={`${event.title} route map`} path={`/events/${event.slug}/route`} />
            </div>
          </>
        )}
      </Section>
    </>
  );
}
