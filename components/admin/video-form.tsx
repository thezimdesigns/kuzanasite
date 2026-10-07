"use client";

import { createVideo, updateVideo } from "@/app/admin/actions/media";
import { AdminForm } from "@/components/admin/admin-form";
import { Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { VIDEO_CATEGORY_LABELS } from "@/lib/options";

export type VideoValues = {
  id?: string;
  title: string;
  url: string;
  description: string;
  date: string;
  eventId: string;
  sessionId: string;
  category: string;
  featured: boolean;
  publishStatus: string;
};

export function VideoForm({
  values: v,
  events,
  sessions,
}: {
  values: VideoValues;
  events: { id: string; title: string }[];
  sessions: { id: string; title: string; event: string }[];
}) {
  return (
    <AdminForm action={v.id ? updateVideo : createVideo} resetOnSuccess={!v.id}>
      {(state, pending) => (
        <div className="space-y-3">
          {v.id && <input type="hidden" name="id" value={v.id} />}
          <Field label="YouTube link" required error={state.errors?.url}>
            <Input name="url" defaultValue={v.url} placeholder="https://youtu.be/…" />
          </Field>
          <Field label="Title" required error={state.errors?.title}>
            <Input name="title" defaultValue={v.title} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category">
              <Select name="category" defaultValue={v.category}>
                {Object.entries(VIDEO_CATEGORY_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
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
            <Field label="Conference session">
              <Select name="sessionId" defaultValue={v.sessionId}>
                <option value="">None</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.event}: {s.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select name="publishStatus" defaultValue={v.publishStatus}>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </Select>
            </Field>
            <div className="flex items-end pb-2">
              <Checkbox name="featured" defaultChecked={v.featured} label="Featured" />
            </div>
          </div>
          <Field label="Description">
            <Textarea name="description" rows={2} defaultValue={v.description} />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : v.id ? "Save video" : "Add video"}
          </Button>
        </div>
      )}
    </AdminForm>
  );
}
