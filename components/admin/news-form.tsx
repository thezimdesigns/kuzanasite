"use client";

import { createNews, updateNews } from "@/app/admin/actions/content";
import { AdminForm } from "@/components/admin/admin-form";
import { Panel } from "@/components/admin/ui";
import { PickList } from "@/components/admin/pick-list";
import { StoryImages, type StoryImage } from "@/components/admin/story-images";
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
  coverCaption: string;
  coverCredit: string;
  coverCreditUrl: string;
  images: StoryImage[];
  nextImageNumber: number;
  author: string;
  eventId: string;
  featured: boolean;
  publishStatus: string;
  publishedAt: string;
  kind: string;
  seriesId: string;
  seriesPart: string;
  exhibitorIds: string[];
  personIds: string[];
};

export type NewsOptions = {
  events: { id: string; title: string }[];
  series: { id: string; title: string }[];
  exhibitors: { id: string; label: string }[];
  people: { id: string; label: string }[];
};

export function NewsForm({ values: v, options, readOnly = false }: { values: NewsValues; options: NewsOptions; readOnly?: boolean }) {
  const { events } = options;
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
              <Field
                label="Story"
                required
                error={state.errors?.body}
                hint="Markdown: ## Subheading, **bold**, - list, [link](https://…). Photos: [image 1] on its own line (add them below)."
              >
                <Textarea id="news-body" name="body" rows={18} defaultValue={v.body} className="font-mono text-sm leading-relaxed" />
              </Field>
              <div className="border-t border-line pt-4">
                <h3 className="mb-2 font-heading text-base font-bold text-green-900">Images in the story</h3>
                <StoryImages initial={v.images} nextNumber={v.nextImageNumber} bodyId="news-body" />
              </div>
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
            <Panel title="Story type">
              <div className="space-y-3">
                <Field label="Kind" hint="Stories and interviews also appear on the Stories page.">
                  <Select name="kind" defaultValue={v.kind}>
                    <option value="UPDATE">News update</option>
                    <option value="STORY">Participant story</option>
                    <option value="INTERVIEW">Interview</option>
                  </Select>
                </Field>
                <div className="grid grid-cols-[1fr_6rem] gap-3">
                  <Field label="Series" hint="For example Signal.">
                    <Select name="seriesId" defaultValue={v.seriesId}>
                      <option value="">Not part of a series</option>
                      {options.series.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Part" error={state.errors?.seriesPart}>
                    <Input name="seriesPart" type="number" min={1} max={999} defaultValue={v.seriesPart} />
                  </Field>
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-ink">Featured exhibitors</p>
                  <PickList name="exhibitorIds" options={options.exhibitors} initial={v.exhibitorIds} placeholder="Type to find an exhibitor…" />
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-ink">Featured people</p>
                  <PickList name="personIds" options={options.people} initial={v.personIds} placeholder="Type to find a speaker, artist or athlete…" />
                </div>
                <p className="text-xs text-muted">Featured exhibitors and people show the story on their profile pages.</p>
              </div>
            </Panel>
            <Panel title="Cover image">
              <div className="space-y-3">
                <UploadField name="coverKey" label="Image (landscape works best)" current={v.coverKey} folder="news" maxDim={2000} />
                <Field label="Caption">
                  <Input name="coverCaption" defaultValue={v.coverCaption} maxLength={300} />
                </Field>
                <Field label="Photo credit / source" hint="Photographer or outlet, shown as “Photo: …”">
                  <Input name="coverCredit" defaultValue={v.coverCredit} maxLength={150} />
                </Field>
                <Field label="Credit link (optional)">
                  <Input name="coverCreditUrl" type="url" defaultValue={v.coverCreditUrl} placeholder="https://" />
                </Field>
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
