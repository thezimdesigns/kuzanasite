import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { can, requireStaff } from "@/lib/permissions";
import { formatDay, formatTime } from "@/lib/time";
import { FeedbackStatusForm } from "@/components/admin/feedback-status-form";
import { AdminPage, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui";

export default async function AdminFeedbackItem({ params }: PageProps<"/admin/feedback/[id]">) {
  const user = await requireStaff();
  const f = await db.feedback.findUnique({
    where: { id: (await params).id },
    include: { event: { select: { title: true } }, venue: { select: { name: true } } },
  });
  if (!f) notFound();
  const wa = f.phone ? `https://wa.me/${f.phone.replace(/[^\d]/g, "").replace(/^0/, "263")}` : null;
  return (
    <AdminPage title={`${f.category} feedback`} back={{ href: "/admin/feedback", label: "Feedback" }}>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel>
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <Badge>{f.category}</Badge>
            {f.rating && <Badge tone="gold">{"★".repeat(f.rating)}</Badge>}
            {f.event && <Badge tone="green">{f.event.title}</Badge>}
            {f.venue && <Badge>{f.venue.name}</Badge>}
            <span className="text-muted">
              {formatDay(f.createdAt)} {formatTime(f.createdAt)}
            </span>
          </div>
          <p className="whitespace-pre-line">{f.message}</p>
          <div className="mt-5 border-t border-line pt-4 text-sm">
            {f.anonymous ? (
              <p className="text-muted">Sent anonymously.</p>
            ) : (
              <dl className="space-y-1">
                <div>
                  <dt className="inline font-semibold">Name: </dt>
                  <dd className="inline">{f.name ?? "-"}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold">Email: </dt>
                  <dd className="inline">{f.email ? <a href={`mailto:${f.email}`} className="underline">{f.email}</a> : "-"}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold">Phone: </dt>
                  <dd className="inline">
                    {f.phone ?? "-"} {wa && f.contactPermission && <a href={wa} target="_blank" rel="noopener" className="ml-2 font-semibold text-green-800 underline">WhatsApp</a>}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold">May contact: </dt>
                  <dd className="inline">{f.contactPermission ? "Yes" : "No"}</dd>
                </div>
              </dl>
            )}
          </div>
        </Panel>
        <Panel title="Handling">
          <FeedbackStatusForm id={f.id} status={f.status} notes={f.adminNotes ?? ""} readOnly={!can(user, "feedback")} />
        </Panel>
      </div>
    </AdminPage>
  );
}
