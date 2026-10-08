import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";
import { PartnerTier } from "@/lib/generated/prisma/enums";
import { PARTNER_TIER_LABELS } from "@/lib/options";
import { CONTACT_EMAIL } from "@/lib/site";
import { SocialLinks } from "@/components/public/social-links";
import { cn, EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Partners & sponsors",
  description: "The convenor, host, technical partner, partners and sponsors behind KUZANA SCEEZ.",
};

const LEAD: PartnerTier[] = ["CONVENOR", "HOST", "TECHNICAL_PARTNER"];
const REST: { tier: PartnerTier; title: string }[] = [
  { tier: "PARTNER", title: "Partners" },
  { tier: "SPONSOR", title: "Sponsors" },
  { tier: "MEDIA", title: "Media partners" },
  { tier: "SUPPORTER", title: "Supporters" },
];

type Partner = Awaited<ReturnType<typeof load>>[number];
const load = () => db.partner.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

export default async function PartnersPage() {
  const partners = await load();
  const lead = LEAD.flatMap((t) => partners.filter((p) => p.tier === t));

  return (
    <>
      <PageHeader title="Partners & sponsors" intro="KUZANA SCEEZ is convened, hosted and delivered with these organisations." />
      <Section>
        {partners.length === 0 && <EmptyState>Partners will be announced soon.</EmptyState>}

        {lead.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {lead.map((p) => (
              <PartnerCard key={p.id} partner={p} lead />
            ))}
          </div>
        )}

        {REST.map(({ tier, title }) => {
          const group = partners.filter((p) => p.tier === tier);
          if (!group.length) return null;
          return (
            <section key={tier} className="mt-12">
              <h2 className="mb-4 text-xl font-extrabold text-green-900 sm:text-2xl">{title}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((p) => (
                  <PartnerCard key={p.id} partner={p} />
                ))}
              </div>
            </section>
          );
        })}

        <p className="mt-14 border-t border-line pt-6 text-sm text-muted">
          Interested in partnering with a future KUZANA edition? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-green-800 underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>
    </>
  );
}

function PartnerCard({ partner: p, lead = false }: { partner: Partner; lead?: boolean }) {
  const logo = p.logoUrl ?? fileUrl(p.logoKey);
  const host = p.url ? new URL(p.url).hostname.replace(/^www\./, "") : null;
  return (
    <article className={cn("flex flex-col rounded-[var(--radius-card)] border border-line bg-white", lead ? "p-6" : "p-5")}>
      <div className={cn("relative mb-5", lead ? (p.prominent ? "h-32" : "h-24") : "h-16")}>
        {logo ? (
          <Image src={logo} alt={`${p.name} logo`} fill sizes="320px" className="object-contain object-left" />
        ) : (
          <span className="font-heading text-xl font-bold">{p.name}</span>
        )}
      </div>
      <p className="text-sm font-semibold text-orange-dark">{p.caption ?? PARTNER_TIER_LABELS[p.tier]}</p>
      <h3 className="mt-0.5 font-heading text-lg leading-snug font-bold">{p.name}</h3>
      {p.description && <p className="mt-2 text-sm leading-relaxed text-muted">{p.description}</p>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        {p.url && host ? (
          <a href={p.url} target="_blank" rel="noopener" className="group inline-flex items-center gap-1 text-sm font-semibold text-green-800">
            {host}
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
          </a>
        ) : (
          <span />
        )}
        <SocialLinks
          name={p.name}
          tone="dark"
          size="sm"
          urls={{
            facebook: p.facebook,
            instagram: p.instagram,
            youtube: p.youtube,
            linkedin: p.linkedin,
          }}
        />
      </div>
    </article>
  );
}
