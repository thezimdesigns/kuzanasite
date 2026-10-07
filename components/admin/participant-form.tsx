"use client";

import { addParticipant } from "@/app/admin/actions/programme";
import { AdminForm } from "@/components/admin/admin-form";
import { Button, Input, Select } from "@/components/ui";
import { PARTICIPANT_ROLE_LABELS } from "@/lib/options";

/** Pick an existing person or type a new name; role per event or session. */
export function ParticipantForm({ people, eventId, sessionId }: { people: { id: string; name: string }[]; eventId?: string; sessionId?: string }) {
  return (
    <AdminForm action={addParticipant} resetOnSuccess>
      {(_, pending) => (
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
          {eventId && <input type="hidden" name="eventId" value={eventId} />}
          {sessionId && <input type="hidden" name="sessionId" value={sessionId} />}
          <Select name="personId" defaultValue="" aria-label="Existing person">
            <option value="">Choose a person…</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Input name="newName" placeholder="…or new person's name" aria-label="New person" />
          <Select name="role" defaultValue="SPEAKER" aria-label="Role">
            {Object.entries(PARTICIPANT_ROLE_LABELS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </Select>
          <Button type="submit" size="sm" variant="secondary" disabled={pending}>
            Add
          </Button>
        </div>
      )}
    </AdminForm>
  );
}
