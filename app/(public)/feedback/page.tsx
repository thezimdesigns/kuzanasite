import type { Metadata } from "next";
import Link from "next/link";
import { getEditionEvents } from "@/lib/programme";
import { db } from "@/lib/db";
import { FeedbackForm } from "@/components/public/feedback-form";
import { FeedbackWall } from "@/components/public/feedback-wall";
import { getFeedbackWall } from "@/lib/feedback";
import { PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Tell KUZANA SCEEZ about your experience: suggestions, compliments, questions, lost and found.",
};

export default async function FeedbackPage({ searchParams }: PageProps<"/feedback">) {
  const sp = await searchParams;
  const [events, venues, wall] = await Promise.all([getEditionEvents(), db.venue.findMany({ orderBy: { sortOrder: "asc" } }), getFeedbackWall(30)]);
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
          . Feedback here goes to the organisers, and is only quoted on the website if you say so.
        </p>
        <FeedbackForm
          events={events.map((e) => ({ id: e.id, title: e.title }))}
          venues={venues.map((v) => ({ id: v.id, name: v.name }))}
          defaultEventId={typeof sp.event === "string" ? sp.event : ""}
        />
      </Section>
      {wall.length > 0 && (
        <div className="border-t border-line bg-cream-dark/50">
          <Section>
            <FeedbackWall
              id="what-people-said"
              items={wall}
              intro="Some of the feedback visitors, exhibitors and speakers sent us, shared with their permission."
            />
          </Section>
        </div>
      )}
    </>
  );
}
