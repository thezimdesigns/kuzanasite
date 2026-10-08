import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";
import { can, requireStaff } from "@/lib/permissions";
import { FloorPlanForm } from "@/components/admin/floor-plan-form";
import { AdminPage, Panel, PublishBadge, ReadOnlyNotice } from "@/components/admin/ui";

export const metadata = { title: "Floor plans" };

export default async function AdminFloorPlans() {
  const user = await requireStaff();
  const editable = can(user, "exhibitors");
  const [plans, venues] = await Promise.all([
    db.floorPlan.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { venue: true, _count: { select: { stalls: true } } },
    }),
    db.venue.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return (
    <AdminPage
      title="Floor plans"
      description="Upload each hall's plan as an image, then click to place stands and link exhibitors. Visitors can zoom, search and find stands at /floor-plan."
    >
      {!editable && <ReadOnlyNotice />}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <ul className="grid gap-3 sm:grid-cols-2">
          {plans.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/floor-plans/${p.id}`}
                className="block overflow-hidden rounded-[var(--radius-card)] border border-line bg-white hover:border-green-800"
              >
                <span className="relative block aspect-[4/3] bg-cream-dark">
                  <Image src={fileUrl(p.imageKey)!} alt="" fill sizes="320px" className="object-contain" />
                </span>
                <span className="block p-3">
                  <span className="flex items-center justify-between gap-2 font-semibold">
                    {p.title} <PublishBadge status={p.publishStatus} />
                  </span>
                  <span className="text-xs text-muted">
                    {p._count.stalls} stands{p.venue && ` · ${p.venue.name}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
          {plans.length === 0 && <p className="text-sm text-muted">No floor plans yet.</p>}
        </ul>
        {editable && (
          <Panel title="New floor plan">
            <FloorPlanForm
              venues={venues}
              values={{
                title: "",
                venueId: "",
                description: "",
                imageKey: "",
                pdfKey: "",
                publishStatus: "PUBLISHED",
                sortOrder: plans.length,
              }}
            />
          </Panel>
        )}
      </div>
    </AdminPage>
  );
}
