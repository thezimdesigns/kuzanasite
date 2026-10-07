import type { Metadata } from "next";
import { QrCode } from "lucide-react";
import { db } from "@/lib/db";
import { exhibitorCodeValid } from "@/lib/exhibitor-access";
import { ExhibitorRegistrationForm } from "@/components/public/exhibitor-registration-form";
import { Card, PageHeader, Section } from "@/components/ui";

// Unlisted: reached only through the QR codes handed out at the exhibition.
export const metadata: Metadata = {
  title: "Register your KUZANA stand",
  robots: { index: false, follow: false },
};

export default async function ExhibitorRegisterPage({ searchParams }: PageProps<"/exhibitors/register">) {
  const sp = await searchParams;
  const code = typeof sp.code === "string" ? sp.code : "";

  if (!exhibitorCodeValid(code)) {
    return (
      <>
        <PageHeader title="Register your KUZANA stand" />
        <Section>
          <Card className="mx-auto max-w-lg p-6 text-center">
            <QrCode className="mx-auto mb-3 size-12 text-green-900" />
            <p className="font-heading text-lg font-bold">Scan the exhibitor QR code to register</p>
            <p className="mt-2 text-muted">
              Stand registration is open to KUZANA exhibitors through the QR code at the exhibitor desk, or from a KUZANA team member
              walking the halls.
            </p>
          </Card>
        </Section>
      </>
    );
  }

  const sectors = await db.exhibitorCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });

  return (
    <>
      <PageHeader
        title="Register your KUZANA stand"
        intro="Takes about 3 minutes. No account needed. Start with the basics and a photo of your stand; you can add more later."
      />
      <Section className="max-w-2xl">
        <ExhibitorRegistrationForm sectors={sectors} code={code} />
      </Section>
    </>
  );
}
