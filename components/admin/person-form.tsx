"use client";

import { createPerson, updatePerson } from "@/app/admin/actions/programme";
import { AdminForm } from "@/components/admin/admin-form";
import { Panel } from "@/components/admin/ui";
import { UploadField } from "@/components/admin/upload-field";
import { Button, Field, Input, Select } from "@/components/ui";
import { RichField } from "@/components/admin/rich-text";

export type PersonValues = Record<
  "name" | "slug" | "jobTitle" | "organisation" | "bio" | "country" | "website" | "linkedin" | "twitter" | "instagram" | "photoKey" | "publishStatus",
  string
> & { id?: string };

export function PersonForm({ values: v, readOnly = false }: { values: PersonValues; readOnly?: boolean }) {
  return (
    <AdminForm action={v.id ? updatePerson : createPerson}>
      {(state, pending) => (
        <fieldset disabled={readOnly}>
          {v.id && <input type="hidden" name="id" value={v.id} />}
          <Panel>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required error={state.errors?.name}>
                <Input name="name" defaultValue={v.name} />
              </Field>
              <Field label="Publish">
                <Select name="publishStatus" defaultValue={v.publishStatus}>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                </Select>
              </Field>
              <Field label="Job title">
                <Input name="jobTitle" defaultValue={v.jobTitle} />
              </Field>
              <Field label="Organisation">
                <Input name="organisation" defaultValue={v.organisation} />
              </Field>
              <Field label="Country">
                <Input name="country" defaultValue={v.country} />
              </Field>
              <Field label="URL slug" error={state.errors?.slug}>
                <Input name="slug" defaultValue={v.slug} />
              </Field>
            </div>
            <div className="mt-4 space-y-4">
              <UploadField name="photoKey" label="Photograph" current={v.photoKey} folder="people" maxDim={900} />
              <RichField label="Biography" name="bio" id="person-bio" defaultValue={v.bio} minRows={6} />
              <div className="grid gap-4 sm:grid-cols-2">
                {(["website", "linkedin", "twitter", "instagram"] as const).map((k) => (
                  <Field key={k} label={k === "twitter" ? "X / Twitter" : k[0].toUpperCase() + k.slice(1)} error={state.errors?.[k]}>
                    <Input name={k} defaultValue={v[k]} />
                  </Field>
                ))}
              </div>
            </div>
          </Panel>
          {!readOnly && (
            <Button type="submit" className="mt-4" disabled={pending}>
              {pending ? "Saving…" : v.id ? "Save profile" : "Create profile"}
            </Button>
          )}
        </fieldset>
      )}
    </AdminForm>
  );
}
