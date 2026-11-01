import type { Metadata } from "next";
import Link from "next/link";
import { getEditionEvents } from "@/lib/programme";
import { db } from "@/lib/db";
import { FeedbackForm } from "@/components/public/feedback-form";
import { PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Tell KUZANA SCEEZ about your experience: suggestions, compliments, questions, lost and found.",
};

export default async function FeedbackPage({ searchParams }: PageProps<"/feedback">) {
  const sp = await searchParams;
  const [events, venues] = await Promise.all([getEditionEvents(), db.venue.findMany({ orderBy: { sortOrder: "asc" } })]);
  return (
    <>
      <PageHeader
        title="Tell us about your KUZANA experience"
        intro="Suggestions, compliments, complaints, questions, or lost and found. Every message is read by the KUZANA team."
      />
      <Section className="max-w-2xl">
        <p className="mb-6 rounded-[var(--radius-control)] bg-green-100 px-4 py-3 text-sm text-green-900">
          Exhibited, spoke, performed or competed? Tell us what came out of it in{" "}
          <Link href="/stories/share" className="font-semibold underline underline-offset-2">
            Share your KUZANA story
          </Link>
          . Feedback here goes privately to the organisers.
        </p>
        <FeedbackForm
          events={events.map((e) => ({ id: e.id, title: e.title }))}
          venues={venues.map((v) => ({ id: v.id, name: v.name }))}
          defaultEventId={typeof sp.event === "string" ? sp.event : ""}
        />
      </Section>
    </>
  );
}
