import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";
import { EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Venues",
  description: "KUZANA SCEEZ venues in Bulawayo: maps, directions, parking and accessibility.",
};

export default async function VenuesPage() {
  const venues = await db.venue.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { events: { where: { publishStatus: "PUBLISHED" } } } } },
  });
  return (
    <>
      <PageHeader title="Venues" intro="Where KUZANA SCEEZ happens: maps, directions, parking and accessibility." />
      <Section>
        {venues.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => {
              const image = fileUrl(v.imageKey);
              return (
                <Link key={v.id} href={`/venues/${v.slug}`} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-white hover:border-green-800">
                  {image && (
                    <div className="relative aspect-video">
                      <Image src={image} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <h2 className="font-heading text-lg font-bold">{v.name}</h2>
                    {v.address && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                        <MapPin className="size-4 text-orange-dark" /> {v.address}
                      </p>
                    )}
                    {v.description && <p className="mt-2 text-sm">{v.description}</p>}
                    <p className="mt-2 text-xs font-semibold text-green-900">{v._count.events} events</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState>Venue information will be published soon.</EmptyState>
        )}
      </Section>
    </>
  );
}
