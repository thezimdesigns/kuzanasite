"use client";

import { createMention, updateMention } from "@/app/admin/actions/content";
import { AdminForm } from "@/components/admin/admin-form";
import { Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { PLATFORM_LABELS } from "@/lib/coverage";

export type MentionValues = {
  id?: string;
  url: string;
  title: string;
  outlet: string;
  platform: string;
  excerpt: string;
  publishedAt: string;
  featured: boolean;
  publishStatus: string;
};

export function MentionForm({ values: v }: { values: MentionValues }) {
  return (
    <AdminForm action={v.id ? updateMention : createMention} resetOnSuccess={!v.id}>
      {(state, pending) => (
        <div className="space-y-3">
          {v.id && <input type="hidden" name="id" value={v.id} />}
          <Field label="Link" required error={state.errors?.url} hint="News article, Facebook or Instagram post, YouTube video, radio or TV page…">
            <Input name="url" defaultValue={v.url} placeholder="https://" />
          </Field>
          {!v.id && <p className="text-xs text-muted">Leave the rest empty to fill it from the page automatically.</p>}
          <Field label="Title" error={state.errors?.title}>
            <Input name="title" defaultValue={v.title} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Outlet / account">
              <Input name="outlet" defaultValue={v.outlet} placeholder="e.g. The Chronicle" />
            </Field>
            <Field label="Platform">
              <Select name="platform" defaultValue={v.platform}>
                <option value="">Detect from link</option>
                {Object.entries(PLATFORM_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" name="publishedAt" defaultValue={v.publishedAt} />
            </Field>
            <Field label="Status">
              <Select name="publishStatus" defaultValue={v.publishStatus}>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Hidden</option>
              </Select>
            </Field>
          </div>
          <Field label="Short summary">
            <Textarea name="excerpt" rows={2} defaultValue={v.excerpt} maxLength={400} />
          </Field>
          <Checkbox name="featured" defaultChecked={v.featured} label="Show first" />
          <Button type="submit" disabled={pending}>
            {pending ? "Fetching details…" : v.id ? "Save" : "Add link"}
          </Button>
        </div>
      )}
    </AdminForm>
  );
}
