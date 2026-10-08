import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";
import { can, requireStaff } from "@/lib/permissions";
import { deleteFloorPlan } from "@/app/admin/actions/exhibitors";
import { ActionButton } from "@/components/admin/admin-form";
import { FloorPlanEditor } from "@/components/admin/floor-plan-editor";
import { FloorPlanForm } from "@/components/admin/floor-plan-form";
import { AdminPage, Panel, ReadOnlyNotice } from "@/components/admin/ui";

export const metadata = { title: "Floor plan" };

export default async function AdminFloorPlan({ params }: PageProps<"/admin/floor-plans/[id]">) {
  const user = await requireStaff();
  const editable = can(user, "exhibitors");
  const { id } = await params;
  const [plan, venues, exhibitors] = await Promise.all([
    db.floorPlan.findUnique({
      where: { id },
      include: { stalls: { orderBy: { label: "asc" } } },
    }),
    db.venue.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    db.exhibitor.findMany({
      where: { status: "APPROVED" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, stand: true },
    }),
  ]);
  if (!plan) notFound();
  return (
    <AdminPage
      title={plan.title}
      back={{ href: "/admin/floor-plans", label: "Floor plans" }}
      actions={
        <Link href={`/floor-plan/${plan.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-green-800 underline">
          View public page <ExternalLink className="size-3.5" />
        </Link>
      }
    >
      {!editable && <ReadOnlyNotice />}
      {editable ? (
        <FloorPlanEditor
          plan={{
            id: plan.id,
            imageUrl: fileUrl(plan.imageKey)!,
            width: plan.imageWidth,
            height: plan.imageHeight,
          }}
          stalls={plan.stalls.map((s) => ({
            id: s.id,
            label: s.label,
            x: s.x,
            y: s.y,
            exhibitorId: s.exhibitorId,
          }))}
          exhibitors={exhibitors}
        />
      ) : (
        <p className="text-sm text-muted">{plan.stalls.length} stands placed.</p>
      )}
      {editable && (
        <details className="mt-8">
          <summary className="cursor-pointer font-semibold text-green-800">Plan details, image and PDF</summary>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <Panel>
              <FloorPlanForm
                venues={venues}
                values={{
                  id: plan.id,
                  title: plan.title,
                  venueId: plan.venueId ?? "",
                  description: plan.description ?? "",
                  imageKey: plan.imageKey,
                  pdfKey: plan.pdfKey ?? "",
                  publishStatus: plan.publishStatus,
                  sortOrder: plan.sortOrder,
                }}
              />
            </Panel>
            <div>
              <ActionButton action={deleteFloorPlan.bind(null, plan.id)} variant="danger" confirm={`Delete "${plan.title}" and all its stands?`}>
                Delete floor plan
              </ActionButton>
            </div>
          </div>
        </details>
      )}
    </AdminPage>
  );
}
