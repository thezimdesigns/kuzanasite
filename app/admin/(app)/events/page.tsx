import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentEdition } from "@/lib/edition";
import { can, requireStaff } from "@/lib/permissions";
import { computeStatus, formatRange, STATUS_LABELS } from "@/lib/time";
import { StatusControl } from "@/components/admin/status-control";
import { AdminPage, PublishBadge, RowLink, Table } from "@/components/admin/ui";
import { Badge, ButtonLink } from "@/components/ui";

export const metadata = { title: "Events" };

export default async function AdminEvents() {
  const user = await requireStaff();
  const editable = can(user, "programme");
  const edition = await getCurrentEdition();
  const events = await db.event.findMany({
    where: edition ? { editionId: edition.id } : {},
    orderBy: [{ startsAt: "asc" }, { sortOrder: "asc" }],
    include: {
      venue: true,
      category: true,
      _count: { select: { sessions: true } },
    },
  });
  const now = new Date();

  return (
    <AdminPage
      title="Events & sessions"
      description={edition?.name}
      actions={
        editable && (
          <ButtonLink href="/admin/events/new" size="sm">
            <Plus className="size-4" /> New event
          </ButtonLink>
        )
      }
    >
      <Table>
        <thead>
          <tr>
            <th>Event</th>
            <th>When</th>
            <th>Venue</th>
            <th>Now</th>
            <th>Override</th>
            <th>Publish</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id}>
              <td>
                <RowLink href={`/admin/events/${e.id}`}>{e.title}</RowLink>
                <div className="text-xs text-muted">
                  {e.category?.name}
                  {e.isConference && ` · ${e._count.sessions} sessions`}
                </div>
              </td>
              <td className="whitespace-nowrap">{formatRange(e.startsAt, e.endsAt, e.timeTbc, e.dailyHours)}</td>
              <td>{e.venue?.name ?? "-"}</td>
              <td>
                <Badge tone={computeStatus(e, now) === "LIVE" ? "orange" : "neutral"}>{STATUS_LABELS[computeStatus(e, now)]}</Badge>
              </td>
              <td>{editable ? <StatusControl id={e.id} value={e.statusOverride} note={e.statusNote} /> : (e.statusOverride ?? "auto")}</td>
              <td>
                <PublishBadge status={e.publishStatus} />
              </td>
            </tr>
          ))}
          {events.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-muted">
                No events yet.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </AdminPage>
  );
}
