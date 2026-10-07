import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { VideoCategory } from "@/lib/generated/prisma/enums";
import { VIDEO_CATEGORY_LABELS } from "@/lib/options";
import { formatDate } from "@/lib/time";
import { VideoCard } from "@/components/public/cards";
import { cn, EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Videos",
  description: "KUZANA SCEEZ videos: highlights, interviews, speeches, conference sessions and performances.",
};

export default async function VideosPage({ searchParams }: PageProps<"/videos">) {
  const sp = await searchParams;
  const category = Object.values(VideoCategory).find((c) => c === sp.category);
  const videos = await db.video.findMany({
    where: { publishStatus: "PUBLISHED", ...(category && { category }) },
    orderBy: [{ featured: "desc" }, { date: "desc" }, { createdAt: "desc" }],
  });
  const [featured, ...rest] = category ? [undefined, ...videos] : videos;

  return (
    <>
      <PageHeader title="Videos" intro="Highlights, interviews, speeches and sessions from KUZANA SCEEZ." />
      <Section>
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          <Chip href="/videos" active={!category}>
            All
          </Chip>
          {Object.entries(VIDEO_CATEGORY_LABELS).map(([k, label]) => (
            <Chip key={k} href={`/videos?category=${k}`} active={category === k}>
              {label}
            </Chip>
          ))}
        </div>
        {videos.length === 0 ? (
          <EmptyState>Videos will be published here.</EmptyState>
        ) : (
          <>
            {featured && (
              <div className="mb-8 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
                <div className="aspect-video overflow-hidden rounded-[var(--radius-card)] bg-ink">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${featured.youtubeId}`}
                    title={featured.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="size-full"
                  />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-green-900">{featured.title}</h2>
                  {featured.date && <p className="mt-1 text-sm text-muted">{formatDate(featured.date)}</p>}
                  {featured.description && <p className="mt-3 whitespace-pre-line">{featured.description}</p>}
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.filter(Boolean).map((v) => (
                <VideoCard key={v!.id} video={v!} />
              ))}
            </div>
          </>
        )}
      </Section>
    </>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "shrink-0 rounded-[var(--radius-control)] border px-3 py-1.5 text-sm font-semibold whitespace-nowrap",
        active ? "border-green-900 bg-green-900 text-white" : "border-line bg-white hover:border-green-800",
      )}
    >
      {children}
    </Link>
  );
}
