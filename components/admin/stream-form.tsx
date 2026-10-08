"use client";

import { createStream, updateStream } from "@/app/admin/actions/programme";
import { AdminForm } from "@/components/admin/admin-form";
import { Button, Checkbox, Field, Input } from "@/components/ui";

export function StreamForm({
  eventId,
  sessionId,
  values: v,
}: {
  eventId?: string;
  sessionId?: string;
  values?: { id: string; label: string; url: string; active: boolean };
}) {
  return (
    <AdminForm action={v ? updateStream : createStream} resetOnSuccess={!v}>
      {(state, pending) => (
        <div className="space-y-3">
          {v && <input type="hidden" name="id" value={v.id} />}
          {eventId && <input type="hidden" name="eventId" value={eventId} />}
          {sessionId && <input type="hidden" name="sessionId" value={sessionId} />}
          <div className="grid gap-3 sm:grid-cols-[1fr_1.6fr]">
            <Field label="Label" required error={state.errors?.label}>
              <Input name="label" defaultValue={v?.label ?? ""} placeholder="e.g. YouTube, ZBC TV, Facebook" />
            </Field>
            <Field label="Stream link" required error={state.errors?.url} hint="YouTube and Facebook videos play on the page; other links open in a new tab.">
              <Input name="url" defaultValue={v?.url ?? ""} placeholder="https://" />
            </Field>
          </div>
          <Checkbox name="active" defaultChecked={v?.active ?? true} label="Show on the site" />
          <Button type="submit" size="sm" disabled={pending}>
            {v ? "Save stream" : "Add stream"}
          </Button>
        </div>
      )}
    </AdminForm>
  );
}
