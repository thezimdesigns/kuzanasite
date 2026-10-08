import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fileUrl } from "@/lib/files";
import { getFloorPlan, getFloorPlans } from "@/lib/floor-plans";
import { EmptyState, PageHeader, Section } from "@/components/ui";
import { PlanSection } from "./plan-section";

export const metadata: Metadata = {
  title: "Floor plan",
  description: "Find exhibitor stands at KUZANA SCEEZ: zoom the floor plan and search by exhibitor or stand number.",
};

export default async function FloorPlansPage() {
  const plans = await getFloorPlans();
  // With a single plan, show it straight away.
  const only = plans.length === 1 ? await getFloorPlan(plans[0].slug) : null;
  return (
    <>
      <PageHeader title="Floor plan" intro="Find any exhibitor's stand. Search by name or stand number, then tap a stand for details." />
      <Section>
        {only ? (
          <PlanSection plan={only} />
        ) : plans.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/floor-plan/${p.slug}`}
                  className="group block overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition-[border-color,box-shadow] hover:border-green-800/50 hover:shadow-[var(--shadow-lift)]"
                >
                  <span className="relative block aspect-[4/3] bg-cream-dark">
                    <Image src={fileUrl(p.imageKey)!} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-contain p-2" />
                  </span>
                  <span className="block border-t border-line p-4">
                    <span className="block font-heading text-lg font-bold text-green-900 group-hover:text-green-800">{p.title}</span>
                    <span className="text-sm text-muted">
                      {p._count.stalls} stands{p.venue && ` · ${p.venue.name}`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>The exhibition floor plan will be published here.</EmptyState>
        )}
      </Section>
    </>
  );
}
