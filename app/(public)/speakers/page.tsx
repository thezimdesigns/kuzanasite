import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Avatar } from "@/components/public/avatar";
import { EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Speakers & participants",
  description: "Speakers, panellists, artists and athletes taking part in KUZANA SCEEZ.",
};

export default async function SpeakersPage() {
  const people = await db.person.findMany({
    where: { publishStatus: "PUBLISHED" },
    orderBy: { name: "asc" },
  });
  return (
    <>
      <PageHeader title="Speakers & participants" intro="The speakers, panellists, artists and athletes of KUZANA SCEEZ." />
      <Section>
        {people.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((p) => (
              <li key={p.id}>
                <Link href={`/speakers/${p.slug}`} className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-white p-3 hover:border-green-800">
                  <Avatar name={p.name} photoKey={p.photoKey} size={56} />
                  <span className="min-w-0">
                    <span className="block font-heading font-bold">{p.name}</span>
                    <span className="block text-sm text-muted">{[p.jobTitle, p.organisation].filter(Boolean).join(", ")}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>Speaker profiles will be published soon.</EmptyState>
        )}
      </Section>
    </>
  );
}
