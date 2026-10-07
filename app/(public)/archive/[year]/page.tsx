import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { computeStatus, formatDate } from "@/lib/time";
import { AlbumCard, EventCard, ExhibitorCard, VideoCard } from "@/components/public/cards";
import { DocumentList } from "@/components/public/document-list";
import { PageHeader, Section, SectionTitle } from "@/components/ui";

async function getEdition(year: number) {
  if (!Number.isInteger(year)) return null;
  return db.edition.findUnique({
    where: { year },
    include: {
      events: { where: { publishStatus: { in: ["PUBLISHED", "ARCHIVED"] } }, include: { venue: true, category: true }, orderBy: { startsAt: "asc" } },
      albums: {
        where: { publishStatus: { in: ["PUBLISHED", "ARCHIVED"] } },
        include: { _count: { select: { photos: true } }, photos: { take: 1, orderBy: { sortOrder: "asc" } } },
        orderBy: { date: "asc" },
      },
      videos: { where: { publishStatus: { in: ["PUBLISHED", "ARCHIVED"] } }, orderBy: { date: "desc" } },
      documents: { where: { publishStatus: { in: ["PUBLISHED", "ARCHIVED"] } }, orderBy: { date: "desc" }, include: { event: { select: { title: true } } } },
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
  return edition ? { title: `${edition.name} archive` } : {};
}

export default async function EditionArchivePage({ params }: PageProps<"/archive/[year]">) {
  const edition = await getEdition(Number((await params).year));
  if (!edition) notFound();
  const now = new Date();
  return (
    <>
      <PageHeader
        back={{ href: "/archive", label: "Archive" }}
        title={edition.name}
        intro={`${formatDate(edition.startDate)} – ${formatDate(edition.endDate)}${edition.theme ? ` · ${edition.theme}` : ""}`}
      />
      {edition.events.length > 0 && (
        <Section>
          <SectionTitle>Programme</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {edition.events.map((e) => (
              <EventCard key={e.id} event={e} status={computeStatus(e, now)} />
            ))}
          </div>
        </Section>
      )}
      {edition.albums.length > 0 && (
        <Section>
          <SectionTitle>Galleries</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {edition.albums.map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </div>
        </Section>
      )}
      {edition.videos.length > 0 && (
        <Section>
          <SectionTitle>Videos</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {edition.videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </Section>
      )}
      {edition.documents.length > 0 && (
        <Section>
          <SectionTitle>Documents</SectionTitle>
          <DocumentList docs={edition.documents} />
        </Section>
      )}
      {edition.exhibitors.length > 0 && (
        <Section>
          <SectionTitle>Exhibitors ({edition.exhibitors.length})</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {edition.exhibitors.map((x) => (
              <ExhibitorCard key={x.id} exhibitor={x} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
