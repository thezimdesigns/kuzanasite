import type { Metadata } from "next";
import Image from "next/image";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";
import { PartnerTier } from "@/lib/generated/prisma/enums";
import { PARTNER_TIER_LABELS } from "@/lib/options";
import { CONTACT_EMAIL } from "@/lib/site";
import { EmptyState, PageHeader, Section, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Partners & sponsors",
  description: "The partners, hosts and sponsors behind KUZANA SCEEZ.",
};

const ORDER: PartnerTier[] = ["HOST", "PARTNER", "SPONSOR", "MEDIA", "SUPPORTER"];

export default async function PartnersPage() {
  const partners = await db.partner.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return (
    <>
      <PageHeader title="Partners & sponsors" intro="KUZANA SCEEZ is made possible by these organisations." />
      <Section>
        {partners.length === 0 && <EmptyState>Partners will be announced soon.</EmptyState>}
        <div className="space-y-10">
          {ORDER.map((tier) => {
            const group = partners.filter((p) => p.tier === tier);
            if (!group.length) return null;
            return (
              <div key={tier}>
                <SectionTitle>{PARTNER_TIER_LABELS[tier]}s</SectionTitle>
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {group.map((p) => {
                    const logo = p.logoUrl ?? fileUrl(p.logoKey);
                    const inner = (
                      <>
                        <div className="relative h-24">
                          {logo ? (
                            <Image src={logo} alt={p.name} fill sizes="240px" className="object-contain" />
                          ) : (
                            <span className="flex h-full items-center justify-center font-heading text-lg font-bold">{p.name}</span>
                          )}
                        </div>
                        <p className="mt-3 text-center text-sm font-semibold">{p.name}</p>
                      </>
                    );
                    return (
                      <li key={p.id} className="rounded-[var(--radius-card)] border border-line bg-white p-4">
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noopener">
                            {inner}
                          </a>
                        ) : (
                          inner
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-12 text-center text-sm text-muted">
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
