import type { Metadata } from "next";
import { Link2Off } from "lucide-react";
import { findValidClaim } from "@/lib/claim";
import { db } from "@/lib/db";
import { ExhibitorClaimForm } from "@/components/public/exhibitor-claim-form";
import { Card, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Complete your exhibitor profile",
  robots: { index: false, follow: false },
};

export default async function ClaimPage({ params }: PageProps<"/exhibitors/claim/[token]">) {
  const { token } = await params;
  const claim = await findValidClaim(token);

  if (!claim) {
    return (
      <>
        <PageHeader title="Complete your exhibitor profile" />
        <Section>
          <Card className="mx-auto max-w-lg p-6 text-center">
            <Link2Off className="mx-auto mb-3 size-12 text-muted" />
            <p className="font-heading text-lg font-bold">This link has expired or is not valid</p>
            <p className="mt-2 text-muted">Please contact the KUZANA team for a new completion link.</p>
          </Card>
        </Section>
      </>
    );
  }

  const sectors = await db.exhibitorCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  const x = claim.exhibitor;

  return (
    <>
      <PageHeader
        eyebrow="Exhibitors"
        title={`Complete your profile: ${x.name}`}
        intro="Check your details and add anything that's missing. No account is needed."
      />
      <Section className="max-w-2xl">
        {claim.exhibitor.reviewNotes && claim.exhibitor.status === "NEEDS_INFORMATION" && (
          <p className="mb-4 rounded-lg bg-orange-50 p-3 text-sm text-orange-dark">The KUZANA team has asked for more information about your stand.</p>
        )}
        <ExhibitorClaimForm
          token={token}
          sectors={sectors}
          exhibitor={{
            name: x.name,
            contactName: x.contactName,
            phone: x.phone,
            email: x.email ?? "",
            categoryId: x.categoryId ?? "",
            hall: x.hall ?? "",
            stand: x.stand ?? "",
            description: x.description ?? "",
            showcasing: x.showcasing ?? "",
            website: x.website ?? "",
            facebook: x.facebook ?? "",
            instagram: x.instagram ?? "",
            linkedin: x.linkedin ?? "",
            tiktok: x.tiktok ?? "",
            whatsapp: x.whatsapp ?? "",
            address: x.address ?? "",
            seeking: x.seeking ?? "",
            offering: x.offering ?? "",
            opportunities: x.opportunities,
            mediaCount: x.media.length,
          }}
        />
      </Section>
    </>
  );
}
