import { db } from "@/lib/db";
import { requireAreaPage } from "@/lib/permissions";
import { dateKey } from "@/lib/time";
import { EventForm } from "@/components/admin/event-form";
import { AdminPage } from "@/components/admin/ui";

export const metadata = { title: "New event" };

export default async function NewEvent() {
  await requireAreaPage("programme");
  const [categories, venues] = await Promise.all([
    db.eventCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    db.venue.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <AdminPage title="New event" back={{ href: "/admin/events", label: "Events" }}>
      <EventForm
        categories={categories}
        venues={venues}
        values={{
          title: "",
          slug: "",
          summary: "",
          description: "",
          categoryId: "",
          venueId: "",
          room: "",
          startsAt: `${dateKey(new Date())}T09:00`,
          endsAt: "",
          timeTbc: false,
          dailyHours: false,
          isConference: false,
          featured: false,
          ticketRequired: false,
          ticketPrice: "",
          ticketUrl: "",
          registrationRequired: false,
          registrationUrl: "",
          contact: "",
          posterKey: "",
          imageKey: "",
          bannerKey: "",
          bannerMobileKey: "",
          programmePdfKey: "",
          programmePdfName: "",
          statusOverride: "",
          statusNote: "",
          publishStatus: "PUBLISHED",
          sortOrder: 0,
        }}
      />
    </AdminPage>
  );
}
