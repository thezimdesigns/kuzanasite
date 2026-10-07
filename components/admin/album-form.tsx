"use client";

import { createAlbum, updateAlbum } from "@/app/admin/actions/media";
import { AdminForm } from "@/components/admin/admin-form";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

export type AlbumValues = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  eventId: string;
  photographer: string;
  sortOrder: number;
  publishStatus: string;
};

export function AlbumForm({ values: v, events, readOnly = false }: { values: AlbumValues; events: { id: string; title: string }[]; readOnly?: boolean }) {
  return (
    <AdminForm action={v.id ? updateAlbum : createAlbum}>
      {(state, pending) => (
        <fieldset disabled={readOnly} className="space-y-3">
          {v.id && <input type="hidden" name="id" value={v.id} />}
          <Field label="Album title" required error={state.errors?.title}>
            <Input name="title" defaultValue={v.title} placeholder="e.g. Opening Ceremony" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date">
              <Input type="date" name="date" defaultValue={v.date} />
            </Field>
            <Field label="Event">
              <Select name="eventId" defaultValue={v.eventId}>
                <option value="">None</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Photographer">
              <Input name="photographer" defaultValue={v.photographer} />
            </Field>
            <Field label="Status">
              <Select name="publishStatus" defaultValue={v.publishStatus}>
                <option value="DRAFT">Draft (hidden)</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <Textarea name="description" rows={2} defaultValue={v.description} />
          </Field>
          {v.id && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="URL slug">
                <Input name="slug" defaultValue={v.slug} />
              </Field>
              <Field label="Sort order">
                <Input type="number" name="sortOrder" defaultValue={v.sortOrder} />
              </Field>
            </div>
          )}
          {!readOnly && (
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : v.id ? "Save album" : "Create album"}
            </Button>
          )}
        </fieldset>
      )}
    </AdminForm>
  );
}
