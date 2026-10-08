import type { Metadata } from "next";
import { getPublishedReports } from "@/lib/stats-server";
import { StatsBoard } from "@/components/public/stats-board";
import { EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "KUZANA in numbers",
  description: "Daily figures from KUZANA SCEEZ: exhibitors, conference delegates and more.",
};

export default async function StatsPage() {
  const reports = await getPublishedReports();
  return (
    <>
      <PageHeader title="KUZANA in numbers" intro="The figures from each day of KUZANA SCEEZ, published daily." />
      <Section>
        {reports.length ? (
          <div className="space-y-16">
            {reports.map((r) => (
              <article key={r.id} id={r.key} className="scroll-mt-28">
                <header className="mb-6">
                  <p className="text-sm font-bold text-orange-dark">{r.dayNumber ? `Day ${r.dayNumber}` : "Daily figures"}</p>
                  <h2 className="font-heading text-2xl font-extrabold tracking-[-0.02em] text-green-900">{r.date}</h2>
                  {r.headline && <p className="mt-1 text-lg">{r.headline}</p>}
                </header>
                <StatsBoard groups={r.groups} />
                {r.note && <p className="mt-6 max-w-[65ch] text-sm text-muted">{r.note}</p>}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState>Daily figures will be published here during the event.</EmptyState>
        )}
      </Section>
    </>
  );
}
