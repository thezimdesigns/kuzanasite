"use client";

import { createAnnouncement, updateAnnouncement } from "@/app/admin/actions/programme";
import { AdminForm } from "@/components/admin/admin-form";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

export type AnnouncementValues = {
  id?: string;
  title: string;
  body: string;
  linkUrl: string;
  priority: string;
  eventId: string;
  expiresAt: string;
  publishStatus: string;
};

export function AnnouncementForm({ values: v, events }: { values: AnnouncementValues; events: { id: string; title: string }[] }) {
  return (
    <AdminForm action={v.id ? updateAnnouncement : createAnnouncement} resetOnSuccess={!v.id}>
      {(state, pending) => (
        <div className="space-y-3">
          {v.id && <input type="hidden" name="id" value={v.id} />}
          <Field label="Title" required error={state.errors?.title}>
            <Input name="title" defaultValue={v.title} placeholder="e.g. Gates open at 08:00" />
          </Field>
          <Field label="Details">
            <Textarea name="body" rows={3} defaultValue={v.body} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Priority" hint="Important and Urgent show as a banner on every page.">
              <Select name="priority" defaultValue={v.priority}>
                <option value="INFO">Info</option>
                <option value="IMPORTANT">Important (gold banner)</option>
                <option value="URGENT">Urgent (red banner)</option>
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
            <Field label="Link (optional)">
              <Input name="linkUrl" defaultValue={v.linkUrl} placeholder="/programme/today or https://…" />
            </Field>
            <Field label="Hide automatically after" hint="Bulawayo time. Leave empty to keep showing.">
              <Input type="datetime-local" name="expiresAt" defaultValue={v.expiresAt} />
            </Field>
            <Field label="Status">
              <Select name="publishStatus" defaultValue={v.publishStatus}>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </Field>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : v.id ? "Save" : "Publish announcement"}
          </Button>
        </div>
      )}
    </AdminForm>
  );
}
