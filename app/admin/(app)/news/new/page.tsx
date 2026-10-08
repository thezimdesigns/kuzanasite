import { db } from "@/lib/db";
import { requireAreaPage } from "@/lib/permissions";
import { toLocalInput } from "@/lib/time";
import { NewsForm } from "@/components/admin/news-form";
import { AdminPage } from "@/components/admin/ui";

export const metadata = { title: "New story" };

export default async function NewNews() {
  await requireAreaPage("press");
  const events = await db.event.findMany({ orderBy: { startsAt: "asc" }, select: { id: true, title: true } });
  return (
    <AdminPage title="New story" back={{ href: "/admin/news", label: "News" }}>
      <NewsForm
        events={events}
        values={{
          title: "",
          slug: "",
          excerpt: "",
          body: "",
          coverKey: "",
          coverAlt: "",
          author: "",
          eventId: "",
          featured: false,
          publishStatus: "PUBLISHED",
          publishedAt: toLocalInput(new Date()),
        }}
      />
    </AdminPage>
  );
}
