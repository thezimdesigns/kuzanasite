import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CoverageColumns } from "@/components/public/coverage-columns";
import { EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "In the media",
  description: "News stories, posts and broadcasts about KUZANA SCEEZ from across the media.",
};

export default async function CoveragePage() {
  const mentions = await db.mediaMention.findMany({
    where: { publishStatus: "PUBLISHED" },
    orderBy: [{ featured: "desc" }, { publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  });
  return (
    <>
      <PageHeader
        back={{ href: "/media", label: "Media centre" }}
        title="In the media"
        intro="What newspapers, websites, broadcasters and social media are saying about KUZANA SCEEZ."
      />
      <Section>{mentions.length ? <CoverageColumns mentions={mentions} /> : <EmptyState>Coverage will be listed here.</EmptyState>}</Section>
    </>
  );
}
