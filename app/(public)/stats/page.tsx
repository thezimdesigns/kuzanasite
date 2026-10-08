import type { Metadata } from "next";
import { getPublishedReports } from "@/lib/stats-server";
import { StatsExplorer } from "@/components/public/stats-explorer";
import { EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "KUZANA in numbers",
  description: "Daily figures from KUZANA SCEEZ: exhibitors and conference delegates, day by day and across the week.",
  alternates: { canonical: "/stats" },
};

export default async function StatsPage({ searchParams }: PageProps<"/stats">) {
  const sp = await searchParams;
  const reports = (await getPublishedReports()).reverse(); // oldest first
  const days = reports.map((r) => ({
    key: r.key,
    label: r.dayNumber ? `Day ${r.dayNumber}` : r.short,
    date: r.date,
    short: r.short,
    headline: r.headline,
    note: r.note,
    groups: r.groups,
  }));
  const requested = typeof sp.day === "string" ? sp.day : null;
  const initial = sp.view === "week" && days.length > 1 ? "week" : days.some((d) => d.key === requested) ? requested! : (days.at(-1)?.key ?? "");

  return (
    <>
      <PageHeader title="KUZANA in numbers" intro="The figures from each day of KUZANA SCEEZ. Pick a day, or compare the whole week." />
      <Section>{days.length ? <StatsExplorer days={days} initial={initial} /> : <EmptyState>Daily figures will be published here during the event.</EmptyState>}</Section>
    </>
  );
}
