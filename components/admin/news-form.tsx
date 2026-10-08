"use client";

import { createNews, updateNews } from "@/app/admin/actions/content";
import { AdminForm } from "@/components/admin/admin-form";
import { Panel } from "@/components/admin/ui";
import { UploadField } from "@/components/admin/upload-field";
import { Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";

export type NewsValues = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverKey: string;
  coverAlt: string;
  author: string;
  eventId: string;
  featured: boolean;
  publishStatus: string;
  publishedAt: string;
};

export function NewsForm({ values: v, events, readOnly = false }: { values: NewsValues; events: { id: string; title: string }[]; readOnly?: boolean }) {
  return (
    <AdminForm action={v.id ? updateNews : createNews}>
      {(state, pending) => (
        <fieldset disabled={readOnly} className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {v.id && <input type="hidden" name="id" value={v.id} />}
          <Panel>
            <div className="space-y-4">
              <Field label="Headline" required error={state.errors?.title}>
                <Input name="title" defaultValue={v.title} className="font-heading text-lg font-bold" />
              </Field>
              <Field label="Standfirst" hint="One or two sentences under the headline and on cards.">
                <Textarea name="excerpt" rows={2} defaultValue={v.excerpt} maxLength={320} />
              </Field>
              <Field label="Story" required error={state.errors?.body} hint="Markdown: ## Subheading, **bold**, - list, [link](https://…)">
                <Textarea name="body" rows={18} defaultValue={v.body} className="font-mono text-sm leading-relaxed" />
              </Field>
            </div>
          </Panel>
          <div className="space-y-6">
            <Panel title="Publishing">
              <div className="space-y-3">
                <Field label="Status">
                  <Select name="publishStatus" defaultValue={v.publishStatus}>
                    <option value="DRAFT">Draft (hidden)</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </Select>
                </Field>
                <Field label="Publish date" hint="Bulawayo time. Stories are ordered by this date.">
                  <Input type="datetime-local" name="publishedAt" defaultValue={v.publishedAt} />
                </Field>
                <Checkbox name="featured" defaultChecked={v.featured} label="Lead story on the homepage" />
                <Field label="Byline">
                  <Input name="author" defaultValue={v.author} placeholder="e.g. KUZANA Media Desk" />
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
                {v.id && (
                  <Field label="URL slug">
                    <Input name="slug" defaultValue={v.slug} />
                  </Field>
                )}
              </div>
            </Panel>
            <Panel title="Cover image">
              <div className="space-y-3">
                <UploadField name="coverKey" label="Image (landscape works best)" current={v.coverKey} folder="news" maxDim={2000} />
                <Field label="Describe the image" hint="For people using screen readers.">
                  <Input name="coverAlt" defaultValue={v.coverAlt} />
                </Field>
              </div>
            </Panel>
            {!readOnly && (
              <Button type="submit" size="lg" className="w-full" disabled={pending}>
                {pending ? "Saving…" : v.id ? "Save story" : "Create story"}
              </Button>
            )}
          </div>
        </fieldset>
      )}
    </AdminForm>
  );
}
