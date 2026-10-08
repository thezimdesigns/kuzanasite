import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { formatRange } from "@/lib/time";
import { Button, EmptyState, Input, PageHeader, Section, SectionTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams).q;
  const q = typeof raw === "string" ? raw.trim().slice(0, 100) : "";
  const contains = { contains: q, mode: "insensitive" as const };

  const results = q
    ? await Promise.all([
        db.event.findMany({ where: { publishStatus: "PUBLISHED", OR: [{ title: contains }, { summary: contains }] }, take: 10 }),
        db.session.findMany({
          where: { publishStatus: "PUBLISHED", event: { publishStatus: "PUBLISHED" }, OR: [{ title: contains }, { description: contains }] },
          include: { event: true },
          take: 10,
        }),
        db.exhibitor.findMany({ where: { status: "APPROVED", OR: [{ name: contains }, { description: contains }, { showcasing: contains }] }, take: 10 }),
        db.person.findMany({ where: { publishStatus: "PUBLISHED", OR: [{ name: contains }, { organisation: contains }] }, take: 10 }),
        db.document.findMany({ where: { publishStatus: "PUBLISHED", OR: [{ title: contains }, { description: contains }] }, take: 10 }),
        db.photoAlbum.findMany({ where: { publishStatus: "PUBLISHED", title: contains }, take: 10 }),
        db.video.findMany({ where: { publishStatus: "PUBLISHED", title: contains }, take: 10 }),
        db.newsPost.findMany({ where: { publishStatus: "PUBLISHED", OR: [{ title: contains }, { excerpt: contains }, { body: contains }] }, take: 10 }),
      ])
    : null;

  const groups = results
    ? [
        { title: "News", items: results[7].map((n) => ({ href: `/news/${n.slug}`, title: n.title, meta: "" })) },
        { title: "Events", items: results[0].map((e) => ({ href: `/events/${e.slug}`, title: e.title, meta: formatRange(e.startsAt, e.endsAt, e.timeTbc) })) },
        { title: "Sessions", items: results[1].map((s) => ({ href: `/events/${s.event.slug}#session-${s.id}`, title: s.title, meta: s.event.title })) },
        { title: "Exhibitors", items: results[2].map((x) => ({ href: `/exhibitors/${x.slug}`, title: x.name, meta: [x.hall && `Hall ${x.hall}`, x.stand && `Stand ${x.stand}`].filter(Boolean).join(" · ") })) },
        { title: "Speakers", items: results[3].map((p) => ({ href: `/speakers/${p.slug}`, title: p.name, meta: p.organisation ?? "" })) },
        { title: "Documents", items: results[4].map((d) => ({ href: `/media/documents/${d.slug}`, title: d.title, meta: "" })) },
        { title: "Galleries", items: results[5].map((a) => ({ href: `/gallery/${a.slug}`, title: a.title, meta: "" })) },
        { title: "Videos", items: results[6].map((v) => ({ href: `https://www.youtube.com/watch?v=${v.youtubeId}`, title: v.title, meta: "" })) },
      ].filter((g) => g.items.length)
    : [];

  return (
    <>
      <PageHeader title="Search KUZANA">
        <form className="flex max-w-xl gap-2" role="search">
          <label className="relative flex-1">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" />
            <Input name="q" type="search" defaultValue={q} placeholder="Events, exhibitors, speakers…" className="pl-10" autoFocus={!q} />
          </label>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </PageHeader>
      <Section>
        {q && groups.length === 0 && <EmptyState>No results for &ldquo;{q}&rdquo;.</EmptyState>}
        <div className="space-y-8">
          {groups.map((g) => (
            <div key={g.title}>
              <SectionTitle>{g.title}</SectionTitle>
              <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-white">
                {g.items.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} className="block px-4 py-3 hover:bg-cream">
                      <span className="font-semibold">{i.title}</span>
                      {i.meta && <span className="block text-sm text-muted">{i.meta}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
