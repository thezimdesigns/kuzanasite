import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Navigation } from "lucide-react";
import { db } from "@/lib/db";
import { googleDirectionsUrl } from "@/lib/geo";
import { venueMapUrl } from "@/lib/programme";
import { MapView } from "@/components/map/map-view";
import { PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Venue map",
  description: "Map of KUZANA SCEEZ venues in Bulawayo with directions.",
};

export default async function VenueMapPage() {
  const venues = await db.venue.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      events: {
        where: { publishStatus: "PUBLISHED" },
        select: { title: true },
        orderBy: { startsAt: "asc" },
      },
    },
  });
  const pinned = venues.filter((v) => v.latitude != null && v.longitude != null);

  return (
    <>
      <PageHeader title="Venue map" intro="Every KUZANA SCEEZ venue in Bulawayo. Tap a pin or a venue for directions in Google Maps." />
      <Section className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="h-[60vh] min-h-[22rem] overflow-hidden rounded-[var(--radius-card)] border border-line lg:h-[70vh]">
          <MapView
            className="size-full"
            markers={pinned.map((v, i) => ({
              id: v.id,
              lat: v.latitude!,
              lng: v.longitude!,
              pin: String(i + 1),
              color: "#00512d",
              title: v.name,
              subtitle: v.events.map((e) => e.title).join(", ") || v.address || undefined,
              link: {
                href: googleDirectionsUrl(v.latitude!, v.longitude!),
                label: "Directions in Google Maps",
              },
            }))}
          />
        </div>
        <ol className="space-y-2">
          {venues.map((v) => {
            const n = pinned.findIndex((p) => p.id === v.id);
            const maps = venueMapUrl(v);
            return (
              <li key={v.id} className="rounded-[var(--radius-card)] border border-line bg-white p-3.5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-green-900 font-heading text-xs font-bold text-white">
                    {n >= 0 ? n + 1 : <MapPin className="size-3.5" aria-hidden />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/venues/${v.slug}`} className="font-heading font-bold leading-snug hover:text-green-800">
                      {v.name}
                    </Link>
                    {v.events.length > 0 && <p className="mt-0.5 text-sm text-muted">{v.events.map((e) => e.title).join(", ")}</p>}
                    {maps ? (
                      <a href={maps} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-dark">
                        <Navigation className="size-4" aria-hidden /> Open in Google Maps
                      </a>
                    ) : (
                      <p className="mt-2 text-xs text-muted">Location coming soon.</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Section>
    </>
  );
}
