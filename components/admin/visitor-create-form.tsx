"use client";

import { createVisitor } from "@/app/admin/actions/engagement";
import { AdminForm } from "@/components/admin/admin-form";
import { Button, Checkbox, Field, Input, Select } from "@/components/ui";
import { VISITOR_INTERESTS, VISITOR_TYPES } from "@/lib/options";

/** Staff registration for walk-ins at the desk. */
export function VisitorCreateForm() {
  return (
    <AdminForm action={createVisitor} resetOnSuccess>
      {(state, pending) => (
        <div className="space-y-3">
          <Field label="Full name" required error={state.errors?.name}>
            <Input name="name" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mobile / WhatsApp" error={state.errors?.phone}>
              <Input name="phone" type="tel" inputMode="tel" />
            </Field>
            <Field label="Email" error={state.errors?.email}>
              <Input name="email" type="email" />
            </Field>
            <Field label="Organisation">
              <Input name="organisation" />
            </Field>
            <Field label="Visitor type">
              <Select name="visitorType" defaultValue="">
                <option value="">-</option>
                {VISITOR_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="City">
              <Input name="city" />
            </Field>
            <Field label="Country">
              <Input name="country" defaultValue="Zimbabwe" />
            </Field>
          </div>
          <details>
            <summary className="cursor-pointer text-sm font-semibold">Interests</summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {VISITOR_INTERESTS.map((i) => (
                <Checkbox key={i} name="interests" value={i} label={i} />
              ))}
            </div>
          </details>
          <Checkbox name="emailConsent" label="The visitor agreed to receive KUZANA updates by email" />
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add visitor"}
          </Button>
        </div>
      )}
    </AdminForm>
  );
}
