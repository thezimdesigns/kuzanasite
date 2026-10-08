import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFloorPlan } from "@/lib/floor-plans";
import { PageHeader, Section } from "@/components/ui";
import { PlanSection } from "../plan-section";

export async function generateMetadata({ params }: PageProps<"/floor-plan/[slug]">): Promise<Metadata> {
  const plan = await getFloorPlan((await params).slug);
  return plan
    ? {
        title: `${plan.title} floor plan`,
        description: `Find exhibitor stands on the ${plan.title} floor plan at KUZANA SCEEZ: search by exhibitor or stand number.`,
        alternates: { canonical: `/floor-plan/${plan.slug}` },
      }
    : {};
}

export default async function FloorPlanPage({ params, searchParams }: PageProps<"/floor-plan/[slug]">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const plan = await getFloorPlan(slug);
  if (!plan) notFound();
  const stand = typeof sp.stand === "string" ? sp.stand : null;
  return (
    <>
      <PageHeader back={{ href: "/floor-plan", label: "Floor plans" }} title={plan.title} />
      <Section>
        <PlanSection plan={plan} focus={stand} />
      </Section>
    </>
  );
}
