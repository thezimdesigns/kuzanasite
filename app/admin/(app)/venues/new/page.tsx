import { requireAreaPage } from "@/lib/permissions";
import { VenueForm } from "@/components/admin/venue-form";
import { AdminPage } from "@/components/admin/ui";

export const metadata = { title: "New venue" };

export default async function NewVenue() {
  await requireAreaPage("programme");
  return (
    <AdminPage title="New venue" back={{ href: "/admin/venues", label: "Venues" }}>
      <VenueForm
        values={{
          name: "",
          slug: "",
          description: "",
          address: "",
          latitude: "",
          longitude: "",
          mapUrl: "",
          directions: "",
          parking: "",
          accessibility: "",
          openingTimes: "",
          contact: "",
          imageKey: "",
          sortOrder: 0,
        }}
      />
    </AdminPage>
  );
}
