import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Map as MapIcon, MapPin, Navigation } from "lucide-react";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";
import { venueMapUrl } from "@/lib/programme";
import { ButtonLink, EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Venues",
  description: "KUZANA SCEEZ venues in Bulawayo: maps, directions, parking and accessibility.",
};

export default async function VenuesPage() {
  const venues = await db.venue.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { events: { where: { publishStatus: "PUBLISHED" } } } },
    },
  });
  return (
    <>
      <PageHeader title="Venues" intro="Where KUZANA SCEEZ happens: maps, directions, parking and accessibility.">
        <ButtonLink href="/map" variant="outline" className="w-fit">
          <MapIcon className="size-4" /> See all venues on the map
        </ButtonLink>
      </PageHeader>
      <Section>
        {venues.length ? (
          <ul className="reveal-list grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => {
              const image = fileUrl(v.imageKey);
              const maps = venueMapUrl(v);
              return (
                <li
                  key={v.id}
                  className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-green-800/40 hover:shadow-[var(--shadow-lift)]"
                >
                  {image && (
                    <div className="relative aspect-video overflow-hidden">
                      <Image src={image} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="font-heading text-lg leading-snug font-bold">
                      <Link href={`/venues/${v.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                        {v.name}
                      </Link>
                    </h2>
                    {v.address && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                        <MapPin className="size-4 shrink-0 text-orange-dark" aria-hidden /> {v.address}
                      </p>
                    )}
                    {v.description && <p className="mt-2 line-clamp-3 text-sm">{v.description}</p>}
                    <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                      <span className="text-xs font-semibold text-green-900">
                        {v._count.events} {v._count.events === 1 ? "event" : "events"}
                      </span>
                      {maps && (
                        <a
                          href={maps}
                          target="_blank"
                          rel="noopener"
                          className="relative z-10 inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-green-900 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-green-800"
                          aria-label={`Open ${v.name} in Google Maps`}
                        >
                          <Navigation className="size-4" aria-hidden /> Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState>Venue information will be published soon.</EmptyState>
        )}
      </Section>
    </>
  );
}
