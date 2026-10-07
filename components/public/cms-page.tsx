import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/time";
import { Markdown } from "@/components/markdown";
import { PageHeader, Section } from "@/components/ui";

export async function getPage(slug: string) {
  return db.page.findUnique({ where: { slug } });
}

/** Renders an editable content page (managed in Admin → Pages). */
export async function CmsPage({ slug, children }: { slug: string; children?: ReactNode }) {
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <>
      <PageHeader title={page.title} intro={page.summary} />
      <Section className="max-w-3xl">
        <Markdown>{page.body}</Markdown>
        {children}
        <p className="mt-10 text-xs text-muted">Last updated {formatDate(page.updatedAt)}</p>
      </Section>
    </>
  );
}
