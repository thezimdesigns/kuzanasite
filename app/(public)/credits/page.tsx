import type { Metadata } from "next";
import Image from "next/image";
import { Globe, Mail, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";
import { SocialLinks } from "@/components/public/social-links";
import { EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Credits",
  description: "The photographers, designers, crews, suppliers and volunteers who delivered KUZANA SCEEZ.",
};

type Provider = Awaited<ReturnType<typeof getProviders>>[number];

function getProviders() {
  return db.serviceProvider.findMany({
    where: { publishStatus: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export default async function CreditsPage() {
  const [categories, providers] = await Promise.all([
    db.serviceCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    getProviders(),
  ]);
  const groups = [
    ...categories.map((c) => ({
      slug: c.slug,
      name: c.name,
      items: providers.filter((p) => p.categoryId === c.id),
    })),
    {
      slug: "other",
      name: "Other services",
      items: providers.filter((p) => !p.categoryId),
    },
  ].filter((g) => g.items.length);

  return (
    <>
      <PageHeader
        title="Credits"
        intro="KUZANA SCEEZ is made by many hands. These are the people and organisations who delivered it. Hire them for your next event."
      />
      {groups.length > 1 && (
        <nav aria-label="Service categories" className="border-b border-line bg-white">
          <ul className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 py-2.5 sm:px-6 [scrollbar-width:none]">
            {groups.map((g) => (
              <li key={g.slug} className="shrink-0">
                <a
                  href={`#${g.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-line bg-white px-3 py-1.5 text-sm font-semibold text-green-900 transition-colors hover:border-green-800"
                >
                  {g.name} <span className="text-xs font-normal text-muted tabular-nums">{g.items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <Section>
        {groups.length ? (
          <div className="space-y-14">
            {groups.map((g) => (
              <section key={g.slug} id={g.slug} aria-labelledby={`h-${g.slug}`} className="scroll-mt-28 grid gap-5 md:grid-cols-[13rem_1fr] md:gap-10">
                <h2
                  id={`h-${g.slug}`}
                  className="font-heading text-xl font-extrabold tracking-[-0.01em] text-green-900 md:sticky md:top-32 md:self-start md:border-t-2 md:border-orange md:pt-3"
                >
                  {g.name}
                </h2>
                <ul className="reveal-list grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((p) => (
                    <li key={p.id}>
                      <ProviderCard p={p} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState>The service providers behind KUZANA will be listed here.</EmptyState>
        )}
      </Section>
    </>
  );
}

function ProviderCard({ p }: { p: Provider }) {
  const photo = fileUrl(p.photoKey);
  const person = p.kind === "PERSON";
  const contactClass =
    "inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-line px-2.5 py-1.5 text-xs font-semibold text-green-900 transition-colors hover:border-green-800 hover:bg-green-100";
  return (
    <article className="flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-white p-4">
      <div className="flex items-center gap-3.5">
        <div
          className={
            person
              ? "relative size-16 shrink-0 overflow-hidden rounded-full bg-green-100"
              : "relative size-16 shrink-0 overflow-hidden rounded-[var(--radius-control)] border border-line bg-white"
          }
        >
          {photo ? (
            <Image src={photo} alt={person ? p.name : `${p.name} logo`} fill sizes="64px" className={person ? "object-cover" : "object-contain p-1.5"} />
          ) : (
            <span className="flex size-full items-center justify-center bg-green-100 font-heading text-lg font-bold text-green-900" aria-hidden>
              {p.name
                .split(/\s+/)
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-heading leading-snug font-bold text-ink">{p.name}</h3>
          {p.role && <p className="text-sm text-orange-deeper">{p.role}</p>}
        </div>
      </div>
      {p.description && <p className="mt-3 text-sm text-muted">{p.description}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
        {p.website && (
          <a href={p.website} target="_blank" rel="noopener" className={contactClass}>
            <Globe className="size-3.5" aria-hidden /> Website
          </a>
        )}
        {p.email && (
          <a href={`mailto:${p.email}`} className={contactClass}>
            <Mail className="size-3.5" aria-hidden /> Email
          </a>
        )}
        {p.phone && (
          <a href={`tel:${p.phone.replace(/[^\d+]/g, "")}`} className={contactClass}>
            <Phone className="size-3.5" aria-hidden /> {p.phone}
          </a>
        )}
        <SocialLinks
          urls={{
            facebook: p.facebook,
            instagram: p.instagram,
            linkedin: p.linkedin,
          }}
          name={p.name}
          size="sm"
          tone="dark"
        />
      </div>
    </article>
  );
}
