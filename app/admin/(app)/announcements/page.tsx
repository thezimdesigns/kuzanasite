import { db } from "@/lib/db";
import { PRIORITY_LABELS } from "@/lib/options";
import { can, requireStaff } from "@/lib/permissions";
import { formatDay, formatTime, toLocalInput } from "@/lib/time";
import { archiveAnnouncement, deleteAnnouncement } from "@/app/admin/actions/programme";
import { ActionButton } from "@/components/admin/admin-form";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { AdminPage, Panel, PublishBadge, ReadOnlyNotice } from "@/components/admin/ui";
import { Badge } from "@/components/ui";

export const metadata = { title: "Announcements" };

export default async function AdminAnnouncements() {
  const user = await requireStaff();
  const editable = can(user, "announcements");
  const [items, events] = await Promise.all([
    db.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { event: { select: { title: true } } } }),
    db.event.findMany({ orderBy: { startsAt: "asc" }, select: { id: true, title: true } }),
  ]);
  const now = new Date();
  return (
    <AdminPage title="Announcements" description="Programme changes, gate times, transport, safety. Shown on KUZANA Live and the homepage.">
      {!editable && <ReadOnlyNotice />}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {editable && (
          <Panel title="New announcement">
            <AnnouncementForm events={events} values={{ title: "", body: "", linkUrl: "", priority: "INFO", eventId: "", expiresAt: "", publishStatus: "PUBLISHED" }} />
            <p className="mt-3 text-xs text-muted">To also notify phones, send it from Messaging.</p>
          </Panel>
        )}
        <div className="space-y-3">
          {items.map((a) => {
            const expired = a.expiresAt && a.expiresAt < now;
            return (
              <Panel key={a.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={a.priority === "URGENT" ? "red" : a.priority === "IMPORTANT" ? "gold" : "neutral"}>{PRIORITY_LABELS[a.priority]}</Badge>
                  <PublishBadge status={a.publishStatus} />
                  {expired && <Badge>expired</Badge>}
                  <span className="text-xs text-muted">
                    {formatDay(a.createdAt)} {formatTime(a.createdAt)}
                    {a.event && ` · ${a.event.title}`}
                  </span>
                </div>
                <p className="mt-2 font-heading font-bold">{a.title}</p>
                {a.body && <p className="text-sm whitespace-pre-line">{a.body}</p>}
                {editable && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-green-800">Edit</summary>
                    <div className="mt-3">
                      <AnnouncementForm
                        events={events}
                        values={{
                          id: a.id,
                          title: a.title,
                          body: a.body ?? "",
                          linkUrl: a.linkUrl ?? "",
                          priority: a.priority,
                          eventId: a.eventId ?? "",
                          expiresAt: toLocalInput(a.expiresAt),
                          publishStatus: a.publishStatus,
                        }}
                      />
                      <div className="mt-3 flex gap-2">
                        {a.publishStatus === "PUBLISHED" && <ActionButton action={archiveAnnouncement.bind(null, a.id)}>Take down</ActionButton>}
                        <ActionButton action={deleteAnnouncement.bind(null, a.id)} variant="ghost" confirm="Delete this announcement?">
                          Delete
                        </ActionButton>
                      </div>
                    </div>
                  </details>
                )}
              </Panel>
            );
          })}
          {items.length === 0 && <p className="text-muted">No announcements yet.</p>}
        </div>
      </div>
    </AdminPage>
  );
}
