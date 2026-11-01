import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSiteState } from "@/lib/edition";
import { StoryForm, type StoryPrefill } from "@/components/public/story-form";
import { PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Share your KUZANA story",
  description: "Took part in KUZANA SCEEZ? Tell us what came out of it and what you are working on now. We feature participant stories all year.",
  alternates: { canonical: "/stories/share" },
};

/** A personal link (?for=<exhibitor or speaker slug>) fills in who the story is about. */
async function prefillFor(slug: string | undefined): Promise<StoryPrefill> {
  if (!slug) return {};
  const exhibitor = await db.exhibitor.findFirst({
    where: { slug, status: "APPROVED" },
    select: { id: true, name: true, contactName: true },
  });
  if (exhibitor) return { exhibitorId: exhibitor.id, name: exhibitor.contactName, organisation: exhibitor.name, role: "Exhibitor" };
  const person = await db.person.findFirst({ where: { slug }, select: { id: true, name: true, organisation: true } });
  if (person) return { personId: person.id, name: person.name, organisation: person.organisation ?? undefined, role: "Speaker or panellist" };
  return {};
}

export default async function ShareStoryPage({ searchParams }: PageProps<"/stories/share">) {
  const forSlug = (await searchParams).for;
  const [prefill, { current, past }] = await Promise.all([prefillFor(typeof forSlug === "string" ? forSlug : undefined), getSiteState()]);
  const nextYear = current && (!past || current.year > past.year) ? current.year : null;

  return (
    <>
      <PageHeader
        title="Share your KUZANA story"
        intro={`Took part in KUZANA SCEEZ${past ? ` ${past.year}` : ""}? Tell us what came out of it and what you are building now. We feature participant stories all year, and the best ones in our series.`}
      />
      <Section className="grid max-w-5xl gap-10 lg:grid-cols-[1fr_17rem]">
        <div className="min-w-0">
          {prefill.organisation && (
            <p className="mb-6 rounded-[var(--radius-control)] bg-green-100 px-4 py-3 text-sm text-green-900">
              Sharing the story of <strong>{prefill.organisation}</strong>.
            </p>
          )}
          <StoryForm prefill={prefill} nextYear={nextYear} />
        </div>
        <aside className="space-y-4 text-sm text-muted lg:pt-10">
          <p>
            <strong className="text-ink">Takes about 5 minutes.</strong> Short answers are fine. We follow up before featuring anyone.
          </p>
          <p>
            Something to tell the organisers about the event itself, good or bad? Use{" "}
            <Link href="/feedback" className="font-semibold text-green-800 underline">
              feedback
            </Link>{" "}
            instead.
          </p>
          <p>
            <Link href="/stories" className="font-semibold text-green-800 underline">
              Read the stories
            </Link>
          </p>
        </aside>
      </Section>
    </>
  );
}
