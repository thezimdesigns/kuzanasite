import { FileDown, MapPin } from "lucide-react";
import Link from "next/link";
import { fileUrl } from "@/lib/files";
import type { getFloorPlan } from "@/lib/floor-plans";
import { FloorPlanExplorer } from "@/components/public/floor-plan-explorer";
import { ButtonLink } from "@/components/ui";

export function PlanSection({ plan, focus }: { plan: NonNullable<Awaited<ReturnType<typeof getFloorPlan>>>; focus?: string | null }) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted">
          {plan.venue && (
            <Link href={`/venues/${plan.venue.slug}`} className="inline-flex items-center gap-1 font-semibold text-green-900 underline underline-offset-2">
              <MapPin className="size-4 text-orange-dark" aria-hidden /> {plan.venue.name}
            </Link>
          )}
          {plan.description && <p className="mt-1 max-w-[65ch]">{plan.description}</p>}
        </div>
        {plan.pdfKey && (
          <ButtonLink href={fileUrl(plan.pdfKey, `${plan.title}.pdf`)!} prefetch={false} variant="outline" size="sm">
            <FileDown className="size-4" /> Printable PDF
          </ButtonLink>
        )}
      </div>
      <FloorPlanExplorer imageUrl={fileUrl(plan.imageKey)!} width={plan.imageWidth} height={plan.imageHeight} stalls={plan.stalls} initialFocus={focus} />
      <p className="mt-3 text-xs text-muted">Pinch or use + and − to zoom. Tap a stand to see who is there.</p>
    </div>
  );
}
