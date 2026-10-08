import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { CmsPage, getPage } from "@/components/public/cms-page";
import { SectionTitle } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("plan-your-visit");
  return {
    title: page?.title ?? "Plan your visit",
    description: page?.summary ?? undefined,
  };
}

export default async function PlanYourVisitPage() {
  const venues = await db.venue.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <CmsPage slug="plan-your-visit">
      {venues.length > 0 && (
        <div className="mt-10">
          <SectionTitle>Venues</SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2">
            {venues.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/venues/${v.slug}`}
                  className="flex items-start gap-2 rounded-[var(--radius-control)] border border-line bg-white p-4 hover:border-green-800"
                >
                  <MapPin className="mt-0.5 size-5 shrink-0 text-orange-dark" />
                  <span>
                    <span className="block font-heading font-bold">{v.name}</span>
                    {v.address && <span className="block text-sm text-muted">{v.address}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </CmsPage>
  );
}
