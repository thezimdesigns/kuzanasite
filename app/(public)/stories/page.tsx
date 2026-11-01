import type { Metadata } from "next";
import { getNews, getSeriesList } from "@/lib/news";
import { SeriesBand, ShareStoryPanel, StoryCard } from "@/components/public/story-blocks";
import { EmptyState, PageHeader, Section, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Stories",
  description: "Series, interviews and participant stories from KUZANA SCEEZ: the people turning sport and creative talent into enterprise, all year round.",
  alternates: { canonical: "/stories" },
};

export default async function StoriesPage() {
  const [series, { posts }] = await Promise.all([getSeriesList(), getNews(24, 0, "stories")]);
  // Series parts already show in their series band; the grid is for stand-alone stories and interviews.
  const standalone = posts.filter((p) => !p.series);
  const [lead, ...rest] = standalone;

  return (
    <>
      <PageHeader
        title="Stories"
        intro="The people behind KUZANA: what they did at the expo, what came of it and what they are building next. Series, interviews and participant stories, all year round."
      />
      {series.map((s, i) => (
        <section key={s.id} className={i % 2 === 0 ? "bg-green-950 text-white" : "border-y border-line bg-white"}>
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <SeriesBand series={s} tone={i % 2 === 0 ? "dark" : "light"} />
          </div>
        </section>
      ))}
      <Section>
        <SectionTitle>Participant stories &amp; interviews</SectionTitle>
        {lead ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <StoryCard post={lead} size="lg" className="md:col-span-2" />
            {rest.map((p) => (
              <StoryCard key={p.id} post={p} />
            ))}
          </div>
        ) : (
          <EmptyState>The first participant stories are being written. Took part in 2026? Tell us yours below.</EmptyState>
        )}
      </Section>
      <ShareStoryPanel />
    </>
  );
}
