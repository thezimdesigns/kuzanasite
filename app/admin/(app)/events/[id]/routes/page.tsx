import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireAreaPage } from "@/lib/permissions";
import { RouteEditor } from "@/components/admin/route-editor";
import { AdminPage } from "@/components/admin/ui";

export const metadata = { title: "Route map" };

export default async function AdminEventRoutes({ params }: PageProps<"/admin/events/[id]/routes">) {
  await requireAreaPage("programme");
  const event = await db.event.findUnique({
    where: { id: (await params).id },
    include: { routes: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { points: { orderBy: { sortOrder: "asc" } } } } },
  });
  if (!event) notFound();
  return (
    <AdminPage
      title={`Route map: ${event.title}`}
      back={{ href: `/admin/events/${event.id}`, label: event.title }}
      description="One route per race distance. Place the start, the turning points and the finish; the public route page draws a line through them in order."
      actions={
        <Link href={`/events/${event.slug}/route`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-green-800 underline">
          View public route page <ExternalLink className="size-3.5" />
        </Link>
      }
    >
      <RouteEditor
        eventId={event.id}
        routes={event.routes.map((r) => ({
          id: r.id,
          name: r.name,
          distanceKm: r.distanceKm,
          color: r.color,
          points: r.points.map((p) => ({ id: p.id, kind: p.kind, label: p.label, lat: p.latitude, lng: p.longitude })),
        }))}
      />
    </AdminPage>
  );
}
