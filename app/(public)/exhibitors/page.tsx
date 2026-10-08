import type { Metadata } from "next";
import { Search } from "lucide-react";
import type { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { ExhibitorCard } from "@/components/public/cards";
import { ShareButtons } from "@/components/public/share-buttons";
import { Button, EmptyState, Input, PageHeader, Section, Select } from "@/components/ui";

export const metadata: Metadata = {
  title: "Exhibitors",
  description: "Explore KUZANA SCEEZ exhibitors: search by name, sector and hall.",
};

export default async function ExhibitorsPage({ searchParams }: PageProps<"/exhibitors">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const sector = typeof sp.sector === "string" ? sp.sector : "";
  const hall = typeof sp.hall === "string" ? sp.hall : "";

  const where: Prisma.ExhibitorWhereInput = {
    status: "APPROVED",
    ...(sector && { category: { slug: sector } }),
    ...(hall && { hall }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { showcasing: { contains: q, mode: "insensitive" } },
        { products: { contains: q, mode: "insensitive" } },
        { stand: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const [exhibitors, sectors, halls, total] = await Promise.all([
    db.exhibitor.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        category: true,
        media: {
          where: { kind: "BOOTH" },
          take: 1,
          orderBy: { sortOrder: "asc" },
        },
      },
      take: 300,
    }),
    db.exhibitorCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    db.exhibitor.findMany({
      where: { status: "APPROVED", hall: { not: null } },
      distinct: ["hall"],
      select: { hall: true },
      orderBy: { hall: "asc" },
    }),
    db.exhibitor.count({ where: { status: "APPROVED" } }),
  ]);

  return (
    <>
      <PageHeader title="Exhibitors" intro={`${total} organisations showcasing at KUZANA SCEEZ. Search by name or product, or filter by sector and hall.`}>
        <ShareButtons title="Explore KUZANA SCEEZ exhibitors" path="/exhibitors" />
      </PageHeader>
      <Section>
        <form className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
          <label className="relative">
            <span className="sr-only">Search exhibitors</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" />
            <Input name="q" defaultValue={q} placeholder="Search name, product or stand" className="pl-10" type="search" />
          </label>
          <Select name="sector" defaultValue={sector} aria-label="Sector">
            <option value="">All sectors</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select name="hall" defaultValue={hall} aria-label="Hall">
            <option value="">All halls</option>
            {halls.map((h) => (
              <option key={h.hall} value={h.hall!}>
                Hall {h.hall}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {exhibitors.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {exhibitors.map((x) => (
              <ExhibitorCard key={x.id} exhibitor={x} />
            ))}
          </div>
        ) : (
          <EmptyState>{q || sector || hall ? "No exhibitors match your search." : "Exhibitors are being added as stands are registered."}</EmptyState>
        )}
      </Section>
    </>
  );
}
