"use client";

import { createUser, updateUser } from "@/app/admin/actions/site";
import { AdminForm } from "@/components/admin/admin-form";
import { Button, Field, Input, Select } from "@/components/ui";

const ROLES = [
  ["VIEWER", "Viewer (read only)"],
  ["PROGRAMME_EDITOR", "Programme editor"],
  ["MEDIA_EDITOR", "Media editor"],
  ["PRESS_OFFICER", "Press officer"],
  ["EXHIBITOR_MANAGER", "Exhibitor manager"],
  ["FEEDBACK_MANAGER", "Feedback manager"],
  ["SUPER_ADMIN", "Super admin"],
];

export function UserCreateForm() {
  return (
    <AdminForm action={createUser} resetOnSuccess>
      {(state, pending) => (
        <div className="space-y-3">
          <Field label="Name" required error={state.errors?.name}>
            <Input name="name" autoComplete="off" />
          </Field>
          <Field label="Email" required error={state.errors?.email}>
            <Input name="email" type="email" autoComplete="off" />
          </Field>
          <Field label="Role">
            <Select name="role" defaultValue="EXHIBITOR_MANAGER">
              {ROLES.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Temporary password" required error={state.errors?.password} hint="At least 10 characters.">
            <Input name="password" type="text" autoComplete="new-password" />
          </Field>
          <Button type="submit" disabled={pending}>
            Create account
          </Button>
        </div>
      )}
    </AdminForm>
  );
}

export function UserEditForm({ id, role, active }: { id: string; role: string; active: boolean }) {
  return (
    <AdminForm action={updateUser}>
      {(state, pending) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={id} />
          <Field label="Role">
            <Select name="role" defaultValue={role}>
              {ROLES.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Access">
            <Select name="active" defaultValue={String(active)}>
              <option value="true">Active</option>
              <option value="false">Disabled</option>
            </Select>
          </Field>
          <Field label="New password (optional)" error={state.errors?.password} className="sm:col-span-2">
            <Input name="password" type="text" autoComplete="new-password" />
          </Field>
          <div>
            <Button type="submit" size="sm" disabled={pending}>
              Save
            </Button>
          </div>
        </div>
      )}
    </AdminForm>
  );
}
