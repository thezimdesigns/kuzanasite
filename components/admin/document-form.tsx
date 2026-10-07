"use client";

import { createDocument, updateDocument } from "@/app/admin/actions/media";
import { AdminForm } from "@/components/admin/admin-form";
import { Panel } from "@/components/admin/ui";
import { UploadField } from "@/components/admin/upload-field";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { DOCUMENT_TYPE_LABELS } from "@/lib/options";

export type DocumentValues = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  body: string;
  type: string;
  date: string;
  author: string;
  eventId: string;
  sessionId: string;
  publishStatus: string;
  key: string;
  fileName: string;
};

export function DocumentForm({
  values: v,
  events,
  sessions,
  readOnly = false,
}: {
  values: DocumentValues;
  events: { id: string; title: string }[];
  sessions: { id: string; title: string; event: string }[];
  readOnly?: boolean;
}) {
  return (
    <AdminForm action={v.id ? updateDocument : createDocument}>
      {(state, pending) => (
        <fieldset disabled={readOnly} className="space-y-6">
          {v.id && <input type="hidden" name="id" value={v.id} />}
          <Panel>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" required error={state.errors?.title} className="sm:col-span-2">
                <Input name="title" defaultValue={v.title} />
              </Field>
              <Field label="Type">
                <Select name="type" defaultValue={v.type}>
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Date">
                <Input type="date" name="date" defaultValue={v.date} />
              </Field>
              <Field label="Author / speaker">
                <Input name="author" defaultValue={v.author} />
              </Field>
              <Field label="Status">
                <Select name="publishStatus" defaultValue={v.publishStatus}>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </Select>
              </Field>
              <Field label="Related event">
                <Select name="eventId" defaultValue={v.eventId}>
                  <option value="">None</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Related session">
                <Select name="sessionId" defaultValue={v.sessionId}>
                  <option value="">None</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.event}: {s.title}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="mt-4 space-y-4">
              <UploadField name="file" mode="json" accept="any" label="File (PDF, Word, PowerPoint or image)" current={v.key} currentName={v.fileName} folder="documents" />
              <Field label="Short description">
                <Textarea name="description" rows={2} defaultValue={v.description} />
              </Field>
              <Field label="Full text (optional)" hint="For press releases and speeches. Markdown supported.">
                <Textarea name="body" rows={10} defaultValue={v.body} />
              </Field>
              {v.id && (
                <Field label="URL slug">
                  <Input name="slug" defaultValue={v.slug} />
                </Field>
              )}
            </div>
          </Panel>
          {!readOnly && (
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : v.id ? "Save document" : "Publish document"}
            </Button>
          )}
        </fieldset>
      )}
    </AdminForm>
  );
}
