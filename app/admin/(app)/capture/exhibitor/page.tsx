import { db } from "@/lib/db";
import { requireAreaPage } from "@/lib/permissions";
import { AdminPage } from "@/components/admin/ui";
import { CaptureExhibitorForm } from "@/components/admin/capture-exhibitor-form";

export const metadata = { title: "Capture exhibitor" };

export default async function CaptureExhibitorPage() {
  await requireAreaPage("exhibitors");
  const sectors = await db.exhibitorCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <AdminPage title="Capture exhibitor" back={{ href: "/admin/capture", label: "Capture" }} description="Aim for about a minute per stand. Details can be completed later.">
      <div className="max-w-xl">
        <CaptureExhibitorForm sectors={sectors} />
      </div>
    </AdminPage>
  );
}
