"use client";

import { createSession, updateSession } from "@/app/admin/actions/programme";
import { AdminForm } from "@/components/admin/admin-form";
import { UploadField } from "@/components/admin/upload-field";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { SESSION_TYPE_LABELS } from "@/lib/options";
import { STATUS_LABELS } from "@/lib/time";

export type SessionValues = {
  id?: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  room: string;
  posterKey: string;
  type: string;
  statusOverride: string;
  publishStatus: string;
  sortOrder: number;
};

export function SessionForm({ eventId, values: v, readOnly = false }: { eventId: string; values: SessionValues; readOnly?: boolean }) {
  return (
    <AdminForm action={v.id ? updateSession : createSession} resetOnSuccess={!v.id}>
      {(state, pending) => (
        <fieldset disabled={readOnly} className="space-y-3">
          <input type="hidden" name="eventId" value={eventId} />
          {v.id && <input type="hidden" name="id" value={v.id} />}
          <Field label="Title" required error={state.errors?.title}>
            <Input name="title" defaultValue={v.title} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts" required error={state.errors?.startsAt}>
              <Input type="datetime-local" name="startsAt" defaultValue={v.startsAt} />
            </Field>
            <Field label="Ends" error={state.errors?.endsAt}>
              <Input type="datetime-local" name="endsAt" defaultValue={v.endsAt} />
            </Field>
            <Field label="Type">
              <Select name="type" defaultValue={v.type}>
                {Object.entries(SESSION_TYPE_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Room">
              <Input name="room" defaultValue={v.room} />
            </Field>
            <Field label="Live status">
              <Select name="statusOverride" defaultValue={v.statusOverride}>
                <option value="">Automatic</option>
                {Object.entries(STATUS_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Publish">
              <Select name="publishStatus" defaultValue={v.publishStatus}>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <Textarea name="description" rows={3} defaultValue={v.description} />
          </Field>
          <UploadField name="posterKey" label="Poster (optional)" current={v.posterKey} folder="sessions" maxDim={2000} />
          <input type="hidden" name="sortOrder" value={v.sortOrder} />
          {!readOnly && (
            <Button type="submit" size="sm" variant="secondary" disabled={pending}>
              {pending ? "Saving…" : v.id ? "Save session" : "Add session"}
            </Button>
          )}
        </fieldset>
      )}
    </AdminForm>
  );
}
