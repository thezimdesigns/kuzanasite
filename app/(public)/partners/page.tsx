import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PartnerTier } from "@/lib/generated/prisma/enums";
import { PARTNER_TIER_LABELS } from "@/lib/options";
import { CONTACT_EMAIL } from "@/lib/site";
import { PartnerStrip } from "@/components/public/partner-strip";
import { EmptyState, PageHeader, Section, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Partners & sponsors",
  description: "The partners, hosts and sponsors behind KUZANA SCEEZ.",
};

const ORDER: PartnerTier[] = ["HOST", "PARTNER", "SPONSOR", "MEDIA", "SUPPORTER"];

export default async function PartnersPage() {
  const partners = await db.partner.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  // Hosts and partners share one strip so the lead partner sits beside them; other tiers get their own rows.
  const core = partners.filter((p) => p.tier === "HOST" || p.tier === "PARTNER");
  return (
    <>
      <PageHeader title="Partners & sponsors" intro="KUZANA SCEEZ is made possible by these organisations." />
      <Section>
        {partners.length === 0 && <EmptyState>Partners will be announced soon.</EmptyState>}
        {core.length > 0 && (
          <div className="rounded-[var(--radius-card)] border border-line bg-white px-6 py-10">
            <PartnerStrip partners={core} />
          </div>
        )}
        <div className="mt-10 space-y-10">
          {ORDER.filter((t) => t !== "HOST" && t !== "PARTNER").map((tier) => {
            const group = partners.filter((p) => p.tier === tier);
            if (!group.length) return null;
            return (
              <div key={tier}>
                <SectionTitle>{PARTNER_TIER_LABELS[tier]}s</SectionTitle>
                <div className="rounded-[var(--radius-card)] border border-line bg-white px-6 py-8">
                  <PartnerStrip partners={group} />
                </div>
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
