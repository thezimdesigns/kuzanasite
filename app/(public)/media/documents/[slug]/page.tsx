import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { fileUrl, formatBytes } from "@/lib/files";
import { DOCUMENT_TYPE_LABELS } from "@/lib/options";
import { formatDate } from "@/lib/time";
import { Markdown } from "@/components/markdown";
import { ShareButtons } from "@/components/public/share-buttons";
import { ButtonLink, PageHeader, Section } from "@/components/ui";

async function getDoc(slug: string) {
  return db.document.findFirst({
    where: { slug, publishStatus: { in: ["PUBLISHED", "ARCHIVED"] } },
    include: { event: { select: { title: true, slug: true } } },
  });
}

export async function generateMetadata({ params }: PageProps<"/media/documents/[slug]">): Promise<Metadata> {
  const d = await getDoc((await params).slug);
  return d ? { title: d.title, description: d.description ?? undefined } : {};
}

export default async function DocumentPage({ params }: PageProps<"/media/documents/[slug]">) {
  const d = await getDoc((await params).slug);
  if (!d) notFound();
  const download = fileUrl(d.key, d.fileName);
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/media" className="underline">
            Media centre · {DOCUMENT_TYPE_LABELS[d.type]}
          </Link>
        }
        title={d.title}
        intro={[d.date && formatDate(d.date), d.author].filter(Boolean).join(" · ")}
      >
        <div className="flex flex-col gap-4">
          {download && (
            <ButtonLink href={download} size="lg" className="w-fit" prefetch={false}>
              <Download className="size-5" /> Download{d.size ? ` (${formatBytes(d.size)})` : ""}
            </ButtonLink>
          )}
          <ShareButtons title={d.title} path={`/media/documents/${d.slug}`} />
        </div>
      </PageHeader>
      <Section className="max-w-3xl">
        {d.description && <p className="mb-6 text-lg text-muted">{d.description}</p>}
        <Markdown>{d.body}</Markdown>
        {d.event && (
          <p className="mt-8 text-sm">
            Related event:{" "}
            <Link href={`/events/${d.event.slug}`} className="font-semibold text-green-800 underline">
              {d.event.title}
            </Link>
          </p>
        )}
      </Section>
    </>
  );
}
