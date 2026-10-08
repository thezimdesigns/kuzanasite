"use client";

import { createEvent, updateEvent } from "@/app/admin/actions/programme";
import { AdminForm } from "@/components/admin/admin-form";
import { Panel } from "@/components/admin/ui";
import { UploadField } from "@/components/admin/upload-field";
import { Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { STATUS_LABELS } from "@/lib/time";

export type EventValues = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  categoryId: string;
  venueId: string;
  room: string;
  startsAt: string;
  endsAt: string;
  timeTbc: boolean;
  dailyHours: boolean;
  isConference: boolean;
  featured: boolean;
  ticketRequired: boolean;
  ticketPrice: string;
  ticketUrl: string;
  registrationRequired: boolean;
  registrationUrl: string;
  contact: string;
  posterKey: string;
  imageKey: string;
  bannerKey: string;
  bannerMobileKey: string;
  programmePdfKey: string;
  programmePdfName: string;
  statusOverride: string;
  statusNote: string;
  publishStatus: string;
  sortOrder: number;
};

export function EventForm({
  values: v,
  categories,
  venues,
  readOnly = false,
}: {
  values: EventValues;
  categories: { id: string; name: string }[];
  venues: { id: string; name: string }[];
  readOnly?: boolean;
}) {
  return (
    <AdminForm action={v.id ? updateEvent : createEvent}>
      {(state, pending) => (
        <fieldset disabled={readOnly} className="space-y-6">
          {v.id && <input type="hidden" name="id" value={v.id} />}
          <Panel title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" required error={state.errors?.title} className="sm:col-span-2">
                <Input name="title" defaultValue={v.title} />
              </Field>
              <Field label="Short summary" className="sm:col-span-2">
                <Input name="summary" defaultValue={v.summary} maxLength={400} />
              </Field>
              <Field label="Category">
                <Select name="categoryId" defaultValue={v.categoryId}>
                  <option value="">-</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Publish status">
                <Select name="publishStatus" defaultValue={v.publishStatus}>
                  <option value="DRAFT">Draft (hidden)</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </Select>
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              <Checkbox name="isConference" defaultChecked={v.isConference} label="Conference (has an agenda of sessions)" />
              <Checkbox name="featured" defaultChecked={v.featured} label="Featured" />
            </div>
          </Panel>

          <Panel title="When & where">
            <p className="mb-3 text-xs text-muted">Times are Bulawayo time (CAT).</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts" required error={state.errors?.startsAt}>
                <Input type="datetime-local" name="startsAt" defaultValue={v.startsAt} />
              </Field>
              <Field label="Ends" error={state.errors?.endsAt} hint="Leave empty if unknown (assumed 2 hours).">
                <Input type="datetime-local" name="endsAt" defaultValue={v.endsAt} />
              </Field>
              <div className="space-y-2 sm:col-span-2">
                <div className="rounded-[var(--radius-control)] border border-line bg-cream px-3 py-2.5">
                  <Checkbox name="dailyHours" defaultChecked={v.dailyHours} label="Same hours every day" />
                  <p className="mt-1 pl-7 text-xs text-muted">
                    For exhibitions that open every day. Start = first day + opening time, End = last day + closing time. Example: Wed 7 Oct 08:00 to Sat 10 Oct
                    17:00 shows as open 08:00–17:00 on each day, and live only during those hours.
                  </p>
                </div>
                <Checkbox name="timeTbc" defaultChecked={v.timeTbc} label="Time to be confirmed (show “Time TBC”, never shown as live automatically)" />
              </div>
              <Field label="Venue">
                <Select name="venueId" defaultValue={v.venueId}>
                  <option value="">-</option>
                  {venues.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Room / location">
                <Input name="room" defaultValue={v.room} placeholder="e.g. Hall 4, Conference Centre" />
              </Field>
            </div>
          </Panel>

          <Panel title="Live status">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status" hint="Automatic uses the clock. Override for delays, cancellations or venue changes.">
                <Select name="statusOverride" defaultValue={v.statusOverride}>
                  <option value="">Automatic</option>
                  {Object.entries(STATUS_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Status note (shown publicly)">
                <Input name="statusNote" defaultValue={v.statusNote} placeholder="e.g. Now starting at 19:00" />
              </Field>
            </div>
          </Panel>

          <Panel title="Tickets & registration">
            <div className="grid gap-4 sm:grid-cols-2">
              <Checkbox name="ticketRequired" defaultChecked={v.ticketRequired} label="Ticket required" />
              <Checkbox name="registrationRequired" defaultChecked={v.registrationRequired} label="Registration required" />
              <Field label="Ticket price">
                <Input name="ticketPrice" defaultValue={v.ticketPrice} placeholder="e.g. US$10" />
              </Field>
              <Field label="Ticket link" error={state.errors?.ticketUrl}>
                <Input name="ticketUrl" defaultValue={v.ticketUrl} />
              </Field>
              <Field label="Registration link" error={state.errors?.registrationUrl}>
                <Input name="registrationUrl" defaultValue={v.registrationUrl} />
              </Field>
              <Field label="Contact details">
                <Input name="contact" defaultValue={v.contact} />
              </Field>
            </div>
          </Panel>

          <Panel title="Programme banner">
            <p className="mb-3 text-sm text-muted">
              A wide image shown above this item in the programme and at the top of its page. Use about 1600 × 500 px; add a taller crop (about 800 × 450 px)
              for phones if the wide one gets too thin.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <UploadField name="bannerKey" label="Banner (wide)" current={v.bannerKey} folder="banners" maxDim={2400} />
              <UploadField name="bannerMobileKey" label="Phone banner (optional)" current={v.bannerMobileKey} folder="banners" maxDim={1200} />
            </div>
          </Panel>

          <Panel title="Detailed programme (PDF)">
            <p className="mb-3 text-sm text-muted">Visitors get a “Download detailed programme” button on this event and in the programme listings.</p>
            <UploadField
              name="programmePdf"
              mode="json"
              accept="document"
              label={v.programmePdfKey ? "Replace PDF" : "Upload PDF"}
              current={v.programmePdfKey}
              currentName={v.programmePdfName}
              folder="programmes"
            />
            {v.programmePdfKey && (
              <div className="mt-3">
                <Checkbox name="removeProgrammePdf" label="Remove the current PDF" />
              </div>
            )}
          </Panel>

          <Panel title="Poster, description & images">
            <Field label="Full description" hint="Markdown supported: **bold**, lists, [links](https://…)">
              <Textarea name="description" rows={8} defaultValue={v.description} />
            </Field>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <UploadField name="posterKey" label="Poster (portrait works best)" current={v.posterKey} folder="events" maxDim={2000} />
              <UploadField name="imageKey" label="Featured image" current={v.imageKey} folder="events" maxDim={2000} />
            </div>
          </Panel>

          <Panel title="Advanced">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="URL slug" hint="Leave empty to generate from the title." error={state.errors?.slug}>
                <Input name="slug" defaultValue={v.slug} />
              </Field>
              <Field label="Sort order">
                <Input type="number" name="sortOrder" defaultValue={v.sortOrder} />
              </Field>
            </div>
          </Panel>

          {!readOnly && (
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Saving…" : v.id ? "Save event" : "Create event"}
            </Button>
          )}
        </fieldset>
      )}
    </AdminForm>
  );
}
