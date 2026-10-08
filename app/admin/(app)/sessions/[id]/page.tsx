import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PARTICIPANT_ROLE_LABELS } from "@/lib/options";
import { can, requireStaff } from "@/lib/permissions";
import { toLocalInput } from "@/lib/time";
import { deleteSession, removeParticipant } from "@/app/admin/actions/programme";
import { ActionButton } from "@/components/admin/admin-form";
import { ParticipantForm } from "@/components/admin/participant-form";
import { SessionForm } from "@/components/admin/session-form";
import { StreamsPanel } from "@/components/admin/streams-panel";
import { AdminPage, Panel, ReadOnlyNotice } from "@/components/admin/ui";
import { Badge } from "@/components/ui";

export default async function AdminSession({ params }: PageProps<"/admin/sessions/[id]">) {
  const user = await requireStaff();
  const editable = can(user, "programme");
  const { id } = await params;
  const [s, people] = await Promise.all([
    db.session.findUnique({
      where: { id },
      include: {
        event: true,
        participants: {
          include: { person: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    db.person.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!s) notFound();
  return (
    <AdminPage title={s.title} back={{ href: `/admin/events/${s.eventId}`, label: s.event.title }}>
      {!editable && <ReadOnlyNotice />}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Session">
          <SessionForm
            eventId={s.eventId}
            readOnly={!editable}
            values={{
              id: s.id,
              title: s.title,
              description: s.description ?? "",
              startsAt: toLocalInput(s.startsAt),
              endsAt: toLocalInput(s.endsAt),
              room: s.room ?? "",
              posterKey: s.posterKey ?? "",
              type: s.type,
              statusOverride: s.statusOverride ?? "",
              publishStatus: s.publishStatus,
              sortOrder: s.sortOrder,
            }}
          />
        </Panel>
        <div className="space-y-6">
          <Panel title="Speakers, panellists & moderators">
            {s.participants.length > 0 && (
              <ul className="mb-4 space-y-2">
                {s.participants.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      <Link href={`/admin/speakers/${p.personId}`} className="font-semibold hover:underline">
                        {p.person.name}
                      </Link>{" "}
                      <Badge>{PARTICIPANT_ROLE_LABELS[p.role]}</Badge>
                    </span>
                    {editable && (
                      <ActionButton action={removeParticipant.bind(null, "session", p.id)} variant="ghost">
                        Remove
                      </ActionButton>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {editable && <ParticipantForm people={people} sessionId={s.id} />}
          </Panel>
          <StreamsPanel sessionId={s.id} editable={editable} />
          <p className="text-sm text-muted">
            To attach slides or a recording, upload a document or add a video and link it to this session.{" "}
            <Link href={`/admin/documents/new?session=${s.id}&event=${s.eventId}`} className="font-semibold text-green-800 underline">
              Upload presentation
            </Link>
          </p>
          {editable && (
            <ActionButton action={deleteSession.bind(null, s.id)} variant="danger" confirm="Delete this session?">
              Delete session
            </ActionButton>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
