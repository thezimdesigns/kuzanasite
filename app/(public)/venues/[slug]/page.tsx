import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Accessibility, Car, Clock, MapPin, Navigation, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";
import { computeStatus } from "@/lib/time";
import { EventCard } from "@/components/public/cards";
import { ShareButtons } from "@/components/public/share-buttons";
import { Markdown } from "@/components/markdown";
import { ButtonLink, Card, Section, SectionTitle } from "@/components/ui";

async function getVenue(slug: string) {
  return db.venue.findUnique({
    where: { slug },
    include: {
      events: {
        where: { publishStatus: "PUBLISHED" },
        include: { venue: true, category: true },
        orderBy: { startsAt: "asc" },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps<"/venues/[slug]">): Promise<Metadata> {
  const venue = await getVenue((await params).slug);
  return venue ? { title: venue.name, description: venue.description ?? undefined } : {};
}

export default async function VenuePage({ params }: PageProps<"/venues/[slug]">) {
  const venue = await getVenue((await params).slug);
  if (!venue) notFound();
  const image = fileUrl(venue.imageKey);
  const mapsUrl =
    venue.mapUrl ??
    (venue.latitude && venue.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name} ${venue.address ?? "Bulawayo"}`)}`);
  const now = new Date();

  const facts = [
    { icon: Clock, label: "Opening times", value: venue.openingTimes },
    { icon: Car, label: "Parking", value: venue.parking },
    { icon: Accessibility, label: "Accessibility", value: venue.accessibility },
    { icon: Phone, label: "Contact", value: venue.contact },
  ].filter((f) => f.value);

  return (
    <>
      <header className="border-b border-line bg-ivory-pattern">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Link href="/venues" className="text-sm font-semibold text-green-800 underline">
            Venues
          </Link>
          <h1 className="mt-1 text-3xl font-extrabold text-green-900 sm:text-4xl">{venue.name}</h1>
          {venue.address && (
            <p className="mt-2 flex items-center gap-1.5 text-muted">
              <MapPin className="size-4 text-orange" /> {venue.address}
            </p>
          )}
          <div className="mt-5 flex flex-col gap-4">
            <ButtonLink href={mapsUrl} target="_blank" rel="noopener" size="lg" className="w-fit">
              <Navigation className="size-4" /> Get directions
            </ButtonLink>
            <ShareButtons title={`${venue.name}: KUZANA SCEEZ venue`} path={`/venues/${venue.slug}`} />
          </div>
        </div>
      </header>
      <Section className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          {image && (
            <div className="relative aspect-video overflow-hidden rounded-[var(--radius-card)]">
              <Image src={image} alt={venue.name} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
            </div>
          )}
          {venue.description && <Markdown>{venue.description}</Markdown>}
          {venue.directions && (
            <div>
              <SectionTitle>Directions</SectionTitle>
              <Markdown>{venue.directions}</Markdown>
            </div>
          )}
          {venue.events.length > 0 && (
            <div>
              <SectionTitle>Events here</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                {venue.events.map((e) => (
                  <EventCard key={e.id} event={e} status={computeStatus(e, now)} />
                ))}
              </div>
            </div>
          )}
        </div>
        {facts.length > 0 && (
          <Card className="h-fit space-y-4 p-5">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-green-900" />
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-sm whitespace-pre-line text-muted">{value}</p>
                </div>
              </div>
            ))}
          </Card>
        )}
      </Section>
    </>
  );
}
