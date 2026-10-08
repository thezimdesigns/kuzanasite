"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Check, Trash2 } from "lucide-react";
import {
  createProvider,
  createServiceCategory,
  deleteServiceCategory,
  moveServiceCategory,
  renameServiceCategory,
  updateProvider,
} from "@/app/admin/actions/site";
import { AdminForm } from "@/components/admin/admin-form";
import { UploadField } from "@/components/admin/upload-field";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";

export type ProviderValues = {
  id?: string;
  name: string;
  kind: string;
  categoryId: string;
  role: string;
  description: string;
  photoKey: string;
  website: string;
  email: string;
  phone: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  publishStatus: string;
  sortOrder: number;
};

export const emptyProvider: ProviderValues = {
  name: "",
  kind: "ORGANISATION",
  categoryId: "",
  role: "",
  description: "",
  photoKey: "",
  website: "",
  email: "",
  phone: "",
  facebook: "",
  instagram: "",
  linkedin: "",
  publishStatus: "PUBLISHED",
  sortOrder: 0,
};

export function ProviderForm({ values: v, categories }: { values: ProviderValues; categories: { id: string; name: string }[] }) {
  return (
    <AdminForm action={v.id ? updateProvider : createProvider} resetOnSuccess={!v.id}>
      {(state, pending) => (
        <div className="space-y-3">
          {v.id && <input type="hidden" name="id" value={v.id} />}
          <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
            <Field label="Name" required error={state.errors?.name}>
              <Input name="name" defaultValue={v.name} />
            </Field>
            <Field label="Type">
              <Select name="kind" defaultValue={v.kind}>
                <option value="ORGANISATION">Organisation</option>
                <option value="PERSON">Person</option>
              </Select>
            </Field>
            <Field label="Category">
              <Select name="categoryId" defaultValue={v.categoryId}>
                <option value="">Other services</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select name="publishStatus" defaultValue={v.publishStatus}>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Hidden</option>
              </Select>
            </Field>
          </div>
          <Field label="Role at KUZANA" hint="e.g. Official photographer, Stage and PA, Event security">
            <Input name="role" defaultValue={v.role} />
          </Field>
          <Field label="Short description">
            <Textarea name="description" rows={3} defaultValue={v.description} maxLength={800} />
          </Field>
          <Field label="Photo or logo">
            <UploadField name="photoKey" label="Upload image" current={v.photoKey || null} folder="providers" maxDim={900} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Website" error={state.errors?.website}>
              <Input name="website" defaultValue={v.website} placeholder="https://" />
            </Field>
            <Field label="Email" error={state.errors?.email}>
              <Input name="email" type="email" defaultValue={v.email} />
            </Field>
            <Field label="Phone / WhatsApp" error={state.errors?.phone}>
              <Input name="phone" type="tel" defaultValue={v.phone} />
            </Field>
            <Field label="Facebook" error={state.errors?.facebook}>
              <Input name="facebook" defaultValue={v.facebook} placeholder="https://facebook.com/…" />
            </Field>
            <Field label="Instagram" error={state.errors?.instagram}>
              <Input name="instagram" defaultValue={v.instagram} placeholder="https://instagram.com/…" />
            </Field>
            <Field label="LinkedIn" error={state.errors?.linkedin}>
              <Input name="linkedin" defaultValue={v.linkedin} placeholder="https://linkedin.com/…" />
            </Field>
          </div>
          <Field label="Order within category">
            <Input name="sortOrder" type="number" defaultValue={v.sortOrder} className="w-28" />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : v.id ? "Save" : "Add"}
          </Button>
        </div>
      )}
    </AdminForm>
  );
}

export function CategoryManager({ categories }: { categories: { id: string; name: string; count: number }[] }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      setError("");
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });

  return (
    <div className="space-y-3">
      {error && <Alert tone="red">{error}</Alert>}
      <ul className="divide-y divide-line">
        {categories.map((c, i) => (
          <CategoryRow
            key={`${c.id}-${c.name}`}
            category={c}
            first={i === 0}
            last={i === categories.length - 1}
            pending={pending}
            onRename={(name) => run(() => renameServiceCategory(c.id, name))}
            onMove={(d) => run(() => moveServiceCategory(c.id, d))}
            onDelete={() => {
              const msg = c.count ? `Delete "${c.name}"? Its ${c.count} providers move to "Other services".` : `Delete "${c.name}"?`;
              if (confirm(msg)) run(() => deleteServiceCategory(c.id));
            }}
          />
        ))}
      </ul>
      <AdminForm action={createServiceCategory} resetOnSuccess>
        {(state, busy) => (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="New category" error={state.errors?.name}>
                <Input name="name" placeholder="e.g. Drone filming" />
              </Field>
            </div>
            <Button type="submit" size="sm" disabled={busy}>
              Add
            </Button>
          </div>
        )}
      </AdminForm>
    </div>
  );
}

function CategoryRow({
  category: c,
  first,
  last,
  pending,
  onRename,
  onMove,
  onDelete,
}: {
  category: { id: string; name: string; count: number };
  first: boolean;
  last: boolean;
  pending: boolean;
  onRename: (name: string) => void;
  onMove: (d: -1 | 1) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(c.name);
  const changed = !!name.trim() && name.trim() !== c.name;
  const icon = "rounded p-1.5 text-muted hover:bg-cream hover:text-ink disabled:opacity-30";
  return (
    <li className="flex items-center gap-1.5 py-1.5">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && changed) onRename(name);
        }}
        aria-label="Category name"
        className="h-9 flex-1 text-sm"
      />
      <span className="w-6 text-center text-xs text-muted tabular-nums" title="Providers in this category">
        {c.count}
      </span>
      {changed && (
        <button type="button" onClick={() => onRename(name)} disabled={pending} className={icon} aria-label="Save name">
          <Check className="size-4 text-green-800" />
        </button>
      )}
      <button type="button" onClick={() => onMove(-1)} disabled={first || pending} className={icon} aria-label="Move up">
        <ArrowUp className="size-4" />
      </button>
      <button type="button" onClick={() => onMove(1)} disabled={last || pending} className={icon} aria-label="Move down">
        <ArrowDown className="size-4" />
      </button>
      <button type="button" onClick={onDelete} disabled={pending} className={`${icon} hover:bg-danger-50 hover:text-danger`} aria-label={`Delete ${c.name}`}>
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}
