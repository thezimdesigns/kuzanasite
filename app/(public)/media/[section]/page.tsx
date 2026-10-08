import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MEDIA_SECTIONS } from "@/lib/options";
import { DocumentList } from "@/components/public/document-list";
import { EmptyState, PageHeader, Section } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/media/[section]">): Promise<Metadata> {
  const s = MEDIA_SECTIONS[(await params).section];
  return s ? { title: s.title } : {};
}

export default async function MediaSectionPage({ params }: PageProps<"/media/[section]">) {
  const { section } = await params;
  const s = MEDIA_SECTIONS[section];
  if (!s) notFound();
  const docs = await db.document.findMany({
    where: {
      publishStatus: { in: ["PUBLISHED", "ARCHIVED"] },
      type: { in: s.types },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { event: { select: { title: true } } },
  });
  return (
    <>
      <PageHeader back={{ href: "/media", label: "Media centre" }} title={s.title} />
      <Section>{docs.length ? <DocumentList docs={docs} /> : <EmptyState>Nothing published here yet.</EmptyState>}</Section>
    </>
  );
}
