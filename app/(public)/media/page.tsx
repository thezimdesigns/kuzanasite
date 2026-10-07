import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { MEDIA_SECTIONS } from "@/lib/options";
import { DocumentList } from "@/components/public/document-list";
import { CONTACT_EMAIL } from "@/lib/site";
import { Card, EmptyState, PageHeader, Section, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Media centre",
  description: "KUZANA SCEEZ press releases, speeches, presentations and press kits.",
};

export default async function MediaPage() {
  const [latest, counts] = await Promise.all([
    db.document.findMany({
      where: { publishStatus: "PUBLISHED" },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 10,
      include: { event: { select: { title: true } } },
    }),
    db.document.groupBy({ by: ["type"], where: { publishStatus: "PUBLISHED" }, _count: true }),
  ]);
  const countFor = (types: string[]) => counts.filter((c) => types.includes(c.type)).reduce((n, c) => n + c._count, 0);

  return (
    <>
      <PageHeader title="Media centre" intro="Press releases, speeches, presentations and press kits for journalists and partners." />
      <Section>
        <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-5">
          {Object.entries(MEDIA_SECTIONS).map(([slug, s]) => (
            <Link key={slug} href={`/media/${slug}`} className="rounded-[var(--radius-card)] border border-line bg-white p-4 hover:border-green-800">
              <p className="font-heading font-bold text-green-900">{s.title}</p>
              <p className="text-sm text-muted">{countFor(s.types)} items</p>
            </Link>
          ))}
        </div>
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <SectionTitle>Latest</SectionTitle>
            {latest.length ? <DocumentList docs={latest} /> : <EmptyState>Media resources will be published here.</EmptyState>}
          </div>
          <Card className="h-fit p-5">
            <h2 className="font-heading text-lg font-bold text-green-900">Media enquiries</h2>
            <p className="mt-2 text-sm">
              For interviews, accreditation and official images, email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-green-800 underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
            <p className="mt-3 text-sm">
              See also the{" "}
              <Link href="/gallery" className="font-semibold text-green-800 underline">
                photo gallery
              </Link>{" "}
              and{" "}
              <Link href="/videos" className="font-semibold text-green-800 underline">
                videos
              </Link>
              .
            </p>
          </Card>
        </div>
      </Section>
    </>
  );
}
