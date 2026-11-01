"use client";

import { createPartner, updatePartner } from "@/app/admin/actions/site";
import { AdminForm } from "@/components/admin/admin-form";
import { UploadField } from "@/components/admin/upload-field";
import { Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { PARTNER_TIER_LABELS } from "@/lib/options";

export type PartnerValues = {
  id?: string;
  name: string;
  url: string;
  tier: string;
  caption: string;
  logoKey: string;
  description: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  prominent: boolean;
  sortOrder: number;
  editionIds: string[];
};

export function PartnerForm({ values: v, editions }: { values: PartnerValues; editions: { id: string; year: number }[] }) {
  return (
    <AdminForm action={v.id ? updatePartner : createPartner} resetOnSuccess={!v.id}>
      {(state, pending) => (
        <div className="space-y-3">
          {v.id && <input type="hidden" name="id" value={v.id} />}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" required error={state.errors?.name}>
              <Input name="name" defaultValue={v.name} />
            </Field>
            <Field label="Type">
              <Select name="tier" defaultValue={v.tier}>
                {Object.entries(PARTNER_TIER_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Website" error={state.errors?.url}>
              <Input name="url" defaultValue={v.url} />
            </Field>
            <Field label="Caption" hint="Shown under the logo, e.g. Host">
              <Input name="caption" defaultValue={v.caption} />
            </Field>
            <Field label="Sort order">
              <Input type="number" name="sortOrder" defaultValue={v.sortOrder} />
            </Field>
          </div>
          <Field label="Short description" hint="One or two sentences shown on the partners page.">
            <Textarea name="description" rows={2} defaultValue={v.description} maxLength={1000} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["facebook", "instagram", "linkedin", "youtube"] as const).map((k) => (
              <Field key={k} label={k === "youtube" ? "YouTube" : k === "linkedin" ? "LinkedIn" : k[0].toUpperCase() + k.slice(1)} error={state.errors?.[k]}>
                <Input name={k} defaultValue={v[k]} placeholder="https://" />
              </Field>
            ))}
          </div>
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-ink">Partner in</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {editions.map((e) => (
                <Checkbox key={e.id} name="editionIds" value={e.id} defaultChecked={v.editionIds.includes(e.id)} label={String(e.year)} />
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">Tick every year they partnered. Leave all unticked for a partner of every edition (e.g. the convenor).</p>
          </fieldset>
          <Checkbox name="prominent" defaultChecked={v.prominent} label="Prominent (shown larger, e.g. the hosting ministry)" />
          <UploadField name="logoKey" label="Logo" current={v.logoKey} folder="partners" maxDim={800} />
          <Button type="submit" size="sm" disabled={pending}>
            {v.id ? "Save" : "Add partner"}
          </Button>
        </div>
      )}
    </AdminForm>
  );
}
