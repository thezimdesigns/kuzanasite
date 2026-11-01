import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { editionDates } from "@/lib/edition";
import { dateKey } from "@/lib/time";
import { EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Archive",
  description: "Every KUZANA SCEEZ edition: programmes, exhibitors, galleries, videos and documents.",
};

export default async function ArchivePage() {
  const today = dateKey(new Date());
  const editions = await db.edition.findMany({
    orderBy: { year: "desc" },
    include: {
      _count: {
        select: {
          events: true,
          exhibitors: { where: { status: "APPROVED" } },
          albums: true,
          videos: true,
          documents: true,
        },
      },
    },
  });
  return (
    <>
      <PageHeader title="KUZANA archive" intro="A permanent record of every KUZANA SCEEZ edition." />
      <Section>
        {editions.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {editions.map((e) =>
              dateKey(e.startDate) > today ? (
                <li key={e.id}>
                  <Link href="/take-part" className="block h-full rounded-[var(--radius-card)] bg-green-900 p-5 text-white hover:bg-green-800">
                    <p className="text-sm font-bold tracking-[0.08em] text-orange-bright uppercase">Coming {editionDates(e)}</p>
                    <p className="mt-1 font-heading text-2xl font-extrabold">{e.name}</p>
                    <p className="mt-3 text-sm text-white/80">Exhibit, sponsor, speak, perform or compete. Find out how to take part.</p>
                  </Link>
                </li>
              ) : (
                <li key={e.id}>
                  <Link href={`/archive/${e.year}`} className="block rounded-[var(--radius-card)] border border-line bg-white p-5 hover:border-green-800">
                    <p className="font-heading text-2xl font-extrabold text-green-900">{e.name}</p>
                    <p className="mt-1 text-sm text-muted">{editionDates(e)}</p>
                    <p className="mt-3 text-sm">
                      {e._count.events} events · {e._count.exhibitors} exhibitors · {e._count.albums} albums · {e._count.videos} videos · {e._count.documents}{" "}
                      documents
                    </p>
                  </Link>
                </li>
              ),
            )}
          </ul>
        ) : (
          <EmptyState>No editions yet.</EmptyState>
        )}
      </Section>
    </>
  );
}
