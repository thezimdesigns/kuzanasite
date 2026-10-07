"use client";

import { createEdition } from "@/app/admin/actions/site";
import { AdminForm } from "@/components/admin/admin-form";
import { Button, Field, Input } from "@/components/ui";

export function EditionForm() {
  return (
    <AdminForm action={createEdition} resetOnSuccess>
      {(state, pending) => (
        <div className="space-y-3">
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <Field label="Year" required error={state.errors?.year}>
              <Input name="year" type="number" placeholder="2027" />
            </Field>
            <Field label="Name" required error={state.errors?.name}>
              <Input name="name" placeholder="KUZANA SCEEZ 2027" />
            </Field>
          </div>
          <Field label="Theme">
            <Input name="theme" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First day" required error={state.errors?.startDate}>
              <Input name="startDate" type="date" />
            </Field>
            <Field label="Last day" required error={state.errors?.endDate}>
              <Input name="endDate" type="date" />
            </Field>
          </div>
          <Button type="submit" disabled={pending}>
            Create edition
          </Button>
        </div>
      )}
    </AdminForm>
  );
}
