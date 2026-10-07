import type { Metadata } from "next";
import { getEditionEvents } from "@/lib/programme";
import { computeStatus } from "@/lib/time";
import { EventCard } from "@/components/public/cards";
import { EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Events",
  description: "All KUZANA SCEEZ events: exhibitions, conferences, boxing, marathon, music and football.",
};

export default async function EventsPage() {
  const events = await getEditionEvents();
  const now = new Date();
  return (
    <>
      <PageHeader title="Events" intro="Exhibitions, conferences, sport and music across Bulawayo." />
      <Section>
        {events.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} status={computeStatus(e, now)} />
            ))}
          </div>
        ) : (
          <EmptyState>Events will be published soon.</EmptyState>
        )}
      </Section>
    </>
  );
}
