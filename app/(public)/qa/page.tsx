import { redirect } from "next/navigation";
import { currentQaConference } from "@/lib/qa";
import { EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata = { title: "Conference questions" };

/** Short link (kuzana.org.zw/qa) to the Q&A of today's or the next conference. */
export default async function QaShortLink() {
  const conference = await currentQaConference();
  if (conference) redirect(`/events/${conference.slug}/qa`);
  return (
    <>
      <PageHeader title="Conference questions" />
      <Section>
        <EmptyState>Questions open when a conference is on.</EmptyState>
      </Section>
    </>
  );
}
