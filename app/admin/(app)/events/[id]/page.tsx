import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { PARTICIPANT_ROLE_LABELS, SESSION_TYPE_LABELS } from "@/lib/options";
import { can, requireStaff } from "@/lib/permissions";
import { dateKey, formatDay, formatTimes, toLocalInput } from "@/lib/time";
import { deleteEvent, publishAllSessions, removeParticipant } from "@/app/admin/actions/programme";
import { ActionButton } from "@/components/admin/admin-form";
import { EventForm } from "@/components/admin/event-form";
import { ParticipantForm } from "@/components/admin/participant-form";
import { SessionForm } from "@/components/admin/session-form";
import { AdminPage, Panel, PublishBadge, ReadOnlyNotice, RowLink, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui";

export default async function AdminEvent({ params }: PageProps<"/admin/events/[id]">) {
  const user = await requireStaff();
  const editable = can(user, "programme");
  const { id } = await params;
  const [e, categories, venues, people] = await Promise.all([
    db.event.findUnique({
      where: { id },
      include: {
        sessions: {
          orderBy: [{ startsAt: "asc" }, { sortOrder: "asc" }],
          include: { participants: { include: { person: true } } },
        },
        participants: { include: { person: true }, orderBy: { sortOrder: "asc" } },
      },
    }),
    db.eventCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    db.venue.findMany({ orderBy: { sortOrder: "asc" } }),
    db.person.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!e) notFound();
  const drafts = e.sessions.filter((s) => s.publishStatus === "DRAFT").length;
  const lastSession = e.sessions.at(-1);
  const nextStart = lastSession ? toLocalInput(lastSession.endsAt ?? new Date(lastSession.startsAt.getTime() + 15 * 60_000)) : toLocalInput(e.startsAt);

  return (
    <AdminPage
      title={e.title}
      back={{ href: "/admin/events", label: "Events" }}
      actions={
        <Link href={`/events/${e.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-green-800 underline">
          View public page <ExternalLink className="size-3.5" />
        </Link>
      }
    >
      {!editable && <ReadOnlyNotice />}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <EventForm
          readOnly={!editable}
          categories={categories}
          venues={venues}
          values={{
            id: e.id,
            title: e.title,
            slug: e.slug,
            summary: e.summary ?? "",
            description: e.description ?? "",
            categoryId: e.categoryId ?? "",
            venueId: e.venueId ?? "",
            room: e.room ?? "",
            startsAt: toLocalInput(e.startsAt),
            endsAt: toLocalInput(e.endsAt),
            timeTbc: e.timeTbc,
            isConference: e.isConference,
            featured: e.featured,
            ticketRequired: e.ticketRequired,
            ticketPrice: e.ticketPrice ?? "",
            ticketUrl: e.ticketUrl ?? "",
            registrationRequired: e.registrationRequired,
            registrationUrl: e.registrationUrl ?? "",
            contact: e.contact ?? "",
            posterKey: e.posterKey ?? "",
            imageKey: e.imageKey ?? "",
            programmePdfKey: e.programmePdfKey ?? "",
            programmePdfName: e.programmePdfName ?? "",
            statusOverride: e.statusOverride ?? "",
            statusNote: e.statusNote ?? "",
            publishStatus: e.publishStatus,
            sortOrder: e.sortOrder,
          }}
        />

        <div className="space-y-6">
          <Panel
            title={`Agenda (${e.sessions.length} sessions)`}
            actions={
              editable && drafts > 0 ? (
                <ActionButton action={publishAllSessions.bind(null, e.id)} confirm={`Publish ${drafts} draft sessions?`}>
                  Publish {drafts} drafts
                </ActionButton>
              ) : null
            }
          >
            {e.sessions.length > 0 && (
              <Table className="mb-4">
                <tbody>
                  {e.sessions.map((s) => (
                    <tr key={s.id}>
                      <td className="text-xs whitespace-nowrap">
                        {dateKey(s.startsAt) !== dateKey(e.startsAt) && `${formatDay(s.startsAt)} `}
                        {formatTimes(s.startsAt, s.endsAt)}
                      </td>
                      <td>
                        <RowLink href={`/admin/sessions/${s.id}`}>{s.title}</RowLink>
                        <div className="text-xs text-muted">
                          {SESSION_TYPE_LABELS[s.type]}
                          {s.participants.length > 0 && ` · ${s.participants.map((p) => p.person.name).join(", ")}`}
                        </div>
                      </td>
                      <td>
                        <PublishBadge status={s.publishStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
            {editable && (
              <details open={e.sessions.length === 0}>
                <summary className="cursor-pointer text-sm font-semibold text-green-800">+ Add session</summary>
                <div className="mt-3">
                  <SessionForm eventId={e.id} values={{ title: "", description: "", startsAt: nextStart, endsAt: "", room: "", posterKey: "", type: "OTHER", statusOverride: "", publishStatus: "PUBLISHED", sortOrder: e.sessions.length }} />
                </div>
              </details>
            )}
          </Panel>

          <Panel title="Featured participants">
            {e.participants.length > 0 && (
              <ul className="mb-4 space-y-2">
                {e.participants.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      <Link href={`/admin/speakers/${p.personId}`} className="font-semibold hover:underline">
                        {p.person.name}
                      </Link>{" "}
                      <Badge>{PARTICIPANT_ROLE_LABELS[p.role]}</Badge>
                    </span>
                    {editable && (
                      <ActionButton action={removeParticipant.bind(null, "event", p.id)} variant="ghost">
                        Remove
                      </ActionButton>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {editable && <ParticipantForm people={people} eventId={e.id} />}
          </Panel>

          {editable && (
            <ActionButton action={deleteEvent.bind(null, e.id)} variant="danger" confirm={`Delete "${e.title}" and all its sessions? This cannot be undone.`}>
              Delete event
            </ActionButton>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
