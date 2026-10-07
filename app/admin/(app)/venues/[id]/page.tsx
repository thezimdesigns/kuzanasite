import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { can, requireStaff } from "@/lib/permissions";
import { deleteVenue } from "@/app/admin/actions/programme";
import { ActionButton } from "@/components/admin/admin-form";
import { VenueForm } from "@/components/admin/venue-form";
import { AdminPage, ReadOnlyNotice } from "@/components/admin/ui";

export default async function AdminVenue({ params }: PageProps<"/admin/venues/[id]">) {
  const user = await requireStaff();
  const editable = can(user, "programme");
  const v = await db.venue.findUnique({ where: { id: (await params).id } });
  if (!v) notFound();
  const s = (x: string | number | null) => (x === null ? "" : String(x));
  return (
    <AdminPage title={v.name} back={{ href: "/admin/venues", label: "Venues" }}>
      {!editable && <ReadOnlyNotice />}
      <VenueForm
        readOnly={!editable}
        values={{
          id: v.id,
          name: v.name,
          slug: v.slug,
          description: s(v.description),
          address: s(v.address),
          latitude: s(v.latitude),
          longitude: s(v.longitude),
          mapUrl: s(v.mapUrl),
          directions: s(v.directions),
          parking: s(v.parking),
          accessibility: s(v.accessibility),
          openingTimes: s(v.openingTimes),
          contact: s(v.contact),
          imageKey: s(v.imageKey),
          sortOrder: v.sortOrder,
        }}
      />
      {editable && (
        <div className="mt-8">
          <ActionButton action={deleteVenue.bind(null, v.id)} variant="danger" confirm={`Delete ${v.name}? Events here will have no venue.`}>
            Delete venue
          </ActionButton>
        </div>
      )}
    </AdminPage>
  );
}
