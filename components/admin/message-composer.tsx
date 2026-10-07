"use client";

import { createMessage } from "@/app/admin/actions/engagement";
import { AdminForm } from "@/components/admin/admin-form";
import { Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";

export function MessageComposer({ audiences }: { audiences: { group: string; options: { value: string; label: string }[] }[] }) {
  return (
    <AdminForm action={createMessage}>
      {(state, pending) => (
        <div className="space-y-3">
          <Field label="Audience" required error={state.errors?.audience}>
            <Select name="audience" defaultValue="all">
              {audiences.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">Channels</legend>
            <div className="flex gap-5">
              <Checkbox name="channels" value="WEB_PUSH" defaultChecked label="Web Push" />
              <Checkbox name="channels" value="EMAIL" label="Email" />
            </div>
            {state.errors?.channels && <p className="text-xs font-semibold text-danger">{state.errors.channels}</p>}
          </fieldset>
          <Field label="Title" required error={state.errors?.title} hint="Keep it short; it's the notification headline.">
            <Input name="title" maxLength={120} placeholder="Programme update" />
          </Field>
          <Field label="Message" required error={state.errors?.body}>
            <Textarea name="body" rows={4} maxLength={2000} placeholder="The venue for today's session has changed…" />
          </Field>
          <Field label="Link" hint="Where tapping the notification goes.">
            <Input name="url" defaultValue="/live" placeholder="/programme/today" />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Preparing…" : "Preview & check recipients"}
          </Button>
        </div>
      )}
    </AdminForm>
  );
}
