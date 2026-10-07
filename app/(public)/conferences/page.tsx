import type { Metadata } from "next";
import { getEditionEvents } from "@/lib/programme";
import { computeStatus } from "@/lib/time";
import { EventCard } from "@/components/public/cards";
import { EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Conferences",
  description: "KUZANA SCEEZ conferences: full-day agendas, speakers, presentations and recordings.",
};

export default async function ConferencesPage() {
  const now = new Date();
  const conferences = (await getEditionEvents()).filter((e) => e.isConference);
  return (
    <>
      <PageHeader title="Conferences" intro="Full-day agendas, speakers, presentations and recordings." />
      <Section>
        {conferences.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {conferences.map((e) => (
              <EventCard key={e.id} event={e} status={computeStatus(e, now)} />
            ))}
          </div>
        ) : (
          <EmptyState>Conference programmes will be published soon.</EmptyState>
        )}
      </Section>
    </>
  );
}
