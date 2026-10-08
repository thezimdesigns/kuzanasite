"use client";

import { updatePage } from "@/app/admin/actions/site";
import { AdminForm } from "@/components/admin/admin-form";
import { Panel } from "@/components/admin/ui";
import { Button, Field, Input, Textarea } from "@/components/ui";

export function PageForm({ values: v, readOnly }: { values: { id: string; title: string; summary: string; body: string }; readOnly: boolean }) {
  return (
    <AdminForm action={updatePage}>
      {(state, pending) => (
        <fieldset disabled={readOnly} className="space-y-4">
          <input type="hidden" name="id" value={v.id} />
          <Panel>
            <div className="space-y-4">
              <Field label="Title" required error={state.errors?.title}>
                <Input name="title" defaultValue={v.title} />
              </Field>
              <Field label="Intro line">
                <Input name="summary" defaultValue={v.summary} />
              </Field>
              <Field label="Content" required error={state.errors?.body} hint="Markdown: ## Heading, **bold**, - bullet, [link text](/programme)">
                <Textarea name="body" rows={22} defaultValue={v.body} className="font-mono text-sm" />
              </Field>
            </div>
          </Panel>
          {!readOnly && (
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save page"}
            </Button>
          )}
        </fieldset>
      )}
    </AdminForm>
  );
}
