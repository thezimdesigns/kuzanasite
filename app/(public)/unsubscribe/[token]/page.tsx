import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button, Card, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

// Unsubscribing needs a button press: email scanners open links automatically.
export default async function UnsubscribePage({ params, searchParams }: PageProps<"/unsubscribe/[token]">) {
  const { token } = await params;
  const done = (await searchParams).done === "1";
  const visitor = await db.visitor.findUnique({ where: { unsubscribeToken: token }, select: { id: true } });

  async function unsubscribe() {
    "use server";
    await db.visitor.updateMany({ where: { unsubscribeToken: token }, data: { emailConsent: false } });
    redirect(`/unsubscribe/${token}?done=1`);
  }

  return (
    <>
      <PageHeader title="Email preferences" />
      <Section className="max-w-lg">
        <Card className="p-6">
          {!visitor ? (
            <p className="text-muted">This unsubscribe link is not valid. If you keep receiving emails, contact technical-partner@kuzana.org.zw.</p>
          ) : done ? (
            <p className="font-heading text-lg font-bold text-green-900">You have been unsubscribed from KUZANA SCEEZ emails.</p>
          ) : (
            <form action={unsubscribe} className="space-y-4">
              <p>Stop receiving KUZANA SCEEZ update emails?</p>
              <Button type="submit">Unsubscribe</Button>
            </form>
          )}
        </Card>
      </Section>
    </>
  );
}
