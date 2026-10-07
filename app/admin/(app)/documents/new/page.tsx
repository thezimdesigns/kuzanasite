import { db } from "@/lib/db";
import { requireAreaPage } from "@/lib/permissions";
import { dateKey } from "@/lib/time";
import { DocumentForm } from "@/components/admin/document-form";
import { AdminPage } from "@/components/admin/ui";

export const metadata = { title: "New document" };

export default async function NewDocument({ searchParams }: PageProps<"/admin/documents/new">) {
  await requireAreaPage("press");
  const sp = await searchParams;
  const [events, sessions] = await Promise.all([
    db.event.findMany({ orderBy: { startsAt: "asc" }, select: { id: true, title: true } }),
    db.session.findMany({ orderBy: { startsAt: "asc" }, select: { id: true, title: true, event: { select: { title: true } } } }),
  ]);
  return (
    <AdminPage title="New document" back={{ href: "/admin/documents", label: "Documents" }}>
      <DocumentForm
        events={events}
        sessions={sessions.map((s) => ({ id: s.id, title: s.title, event: s.event.title }))}
        values={{
          title: "",
          slug: "",
          description: "",
          body: "",
          type: sp.session ? "PRESENTATION" : "PRESS_RELEASE",
          date: dateKey(new Date()),
          author: "",
          eventId: typeof sp.event === "string" ? sp.event : "",
          sessionId: typeof sp.session === "string" ? sp.session : "",
          publishStatus: "PUBLISHED",
          key: "",
          fileName: "",
        }}
      />
    </AdminPage>
  );
}
