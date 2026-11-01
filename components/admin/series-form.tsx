"use client";

import { saveSeries } from "@/app/admin/actions/content";
import { AdminForm } from "@/components/admin/admin-form";
import { UploadField } from "@/components/admin/upload-field";
import { Button, Field, Input, Select } from "@/components/ui";
import { RichField } from "@/components/admin/rich-text";

export type SeriesValues = {
  id?: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  author: string;
  coverKey: string;
  sortOrder: number;
  publishStatus: string;
};

export function SeriesForm({ values: v, readOnly = false }: { values: SeriesValues; readOnly?: boolean }) {
  return (
    <AdminForm action={saveSeries}>
      {(state, pending) => (
        <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
          {v.id && <input type="hidden" name="id" value={v.id} />}
          <Field label="Title" required error={state.errors?.title}>
            <Input name="title" defaultValue={v.title} placeholder="Signal" />
          </Field>
          <Field label="Author">
            <Input name="author" defaultValue={v.author} placeholder="Who writes it" />
          </Field>
          <Field label="Tagline" hint="One line under the title, on the homepage and the series page." className="sm:col-span-2">
            <Input name="tagline" defaultValue={v.tagline} maxLength={200} />
          </Field>
          <RichField label="About the series" className="sm:col-span-2" name="description" id="series-description" defaultValue={v.description} minRows={4} />
          <Field label="Status">
            <Select name="publishStatus" defaultValue={v.publishStatus}>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft (hidden)</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </Field>
          <Field label="Order" hint="Lower numbers show first.">
            <Input name="sortOrder" type="number" min={0} defaultValue={v.sortOrder} />
          </Field>
          {v.id && (
            <Field label="URL slug" hint={`kuzana.org.zw/series/${v.slug}`}>
              <Input name="slug" defaultValue={v.slug} />
            </Field>
          )}
          <div className="sm:col-span-2">
            <UploadField name="coverKey" label="Cover image (optional)" current={v.coverKey} folder="news" maxDim={2000} />
          </div>
          {!readOnly && (
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : v.id ? "Save series" : "Create series"}
              </Button>
            </div>
          )}
        </fieldset>
      )}
    </AdminForm>
  );
}
