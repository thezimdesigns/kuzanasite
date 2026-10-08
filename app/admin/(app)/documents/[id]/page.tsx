import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { can, requireStaff } from "@/lib/permissions";
import { toDateInput } from "@/lib/time";
import { deleteDocument } from "@/app/admin/actions/media";
import { ActionButton } from "@/components/admin/admin-form";
import { DocumentForm } from "@/components/admin/document-form";
import { AdminPage, ReadOnlyNotice } from "@/components/admin/ui";

export default async function AdminDocument({ params }: PageProps<"/admin/documents/[id]">) {
  const user = await requireStaff();
  const editable = can(user, "press");
  const { id } = await params;
  const [d, events, sessions] = await Promise.all([
    db.document.findUnique({ where: { id } }),
    db.event.findMany({
      orderBy: { startsAt: "asc" },
      select: { id: true, title: true },
    }),
    db.session.findMany({
      orderBy: { startsAt: "asc" },
      select: { id: true, title: true, event: { select: { title: true } } },
    }),
  ]);
  if (!d) notFound();
  return (
    <AdminPage
      title={d.title}
      back={{ href: "/admin/documents", label: "Documents" }}
      actions={
        <Link href={`/media/documents/${d.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-green-800 underline">
          View public page <ExternalLink className="size-3.5" />
        </Link>
      }
    >
      {!editable && <ReadOnlyNotice />}
      <DocumentForm
        readOnly={!editable}
        events={events}
        sessions={sessions.map((s) => ({
          id: s.id,
          title: s.title,
          event: s.event.title,
        }))}
        values={{
          id: d.id,
          title: d.title,
          slug: d.slug,
          description: d.description ?? "",
          body: d.body ?? "",
          type: d.type,
          date: toDateInput(d.date),
          author: d.author ?? "",
          eventId: d.eventId ?? "",
          sessionId: d.sessionId ?? "",
          publishStatus: d.publishStatus,
          key: d.key ?? "",
          fileName: d.fileName ?? "",
        }}
      />
      {editable && (
        <div className="mt-8">
          <ActionButton action={deleteDocument.bind(null, d.id)} variant="danger" confirm="Delete this document and its file?">
            Delete document
          </ActionButton>
        </div>
      )}
    </AdminPage>
  );
}
