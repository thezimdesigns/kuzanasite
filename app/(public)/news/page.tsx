import type { Metadata } from "next";
import Link from "next/link";
import { getNews } from "@/lib/news";
import { LeadStory, NewsRow } from "@/components/public/news-blocks";
import { EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "News",
  description: "News and stories from KUZANA SCEEZ: sport, creative industries and the business of talent in Zimbabwe.",
};

const PAGE = 12;

export default async function NewsPage({ searchParams }: PageProps<"/news">) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { posts, hasMore } = await getNews(PAGE * page);
  const [lead, ...rest] = posts;

  return (
    <>
      <PageHeader title="News" intro="Announcements, results and stories from the KUZANA week and beyond." />
      <Section>
        {!lead ? (
          <EmptyState>Stories will appear here during the event.</EmptyState>
        ) : (
          <>
            <LeadStory post={lead} />
            {rest.length > 0 && (
              <div className="mt-10 grid gap-x-10 md:grid-cols-2">
                {rest.map((p) => (
                  <NewsRow key={p.id} post={p} className="border-b border-line" />
                ))}
              </div>
            )}
            {hasMore && (
              <div className="mt-8 text-center">
                <Link
                  href={`/news?page=${page + 1}`}
                  scroll={false}
                  className="inline-flex rounded-[var(--radius-control)] border border-green-900/40 bg-white px-5 py-2.5 font-heading font-semibold text-green-900 hover:border-green-900"
                >
                  Older stories
                </Link>
              </div>
            )}
          </>
        )}
      </Section>
    </>
  );
}
