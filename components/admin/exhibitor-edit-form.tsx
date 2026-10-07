"use client";

import { useState } from "react";
import { updateExhibitor } from "@/app/admin/actions/exhibitors";
import { AdminForm } from "@/components/admin/admin-form";
import { Panel } from "@/components/admin/ui";
import { Uploader, type UploadedFile } from "@/components/uploader";
import { Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { OPPORTUNITIES } from "@/lib/options";
import type { ExhibitorMediaKind } from "@/lib/generated/prisma/enums";

type X = Record<
  | "id" | "name" | "contactName" | "phone" | "email" | "categoryId" | "hall" | "stand" | "description" | "showcasing" | "products"
  | "website" | "facebook" | "instagram" | "linkedin" | "tiktok" | "whatsapp" | "address" | "seeking" | "offering" | "reviewNotes",
  string
> & { opportunities: string[]; consent: boolean };

export function ExhibitorEditForm({ x, sectors, readOnly }: { x: X; sectors: { id: string; name: string }[]; readOnly: boolean }) {
  const [media, setMedia] = useState<Record<string, (UploadedFile & { kind: ExhibitorMediaKind })[]>>({});
  const [round, setRound] = useState(0);
  const all = Object.values(media).flat().map(({ preview: _p, ...m }) => m);
  const setGroup = (g: string, kind: ExhibitorMediaKind) => (files: UploadedFile[]) => setMedia((m) => ({ ...m, [g]: files.map((f) => ({ ...f, kind })) }));

  return (
    <AdminForm
      action={async (prev, fd) => {
        const r = await updateExhibitor(prev, fd);
        if (r.ok) {
          setMedia({});
          setRound((n) => n + 1);
        }
        return r;
      }}
      className="space-y-6"
    >
      {(state, pending) => (
        <fieldset disabled={readOnly} className="space-y-6">
          <input type="hidden" name="id" value={x.id} />
          <input type="hidden" name="media" value={JSON.stringify(all)} />
          <Panel title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Organisation name" required error={state.errors?.name}>
                <Input name="name" defaultValue={x.name} />
              </Field>
              <Field label="Sector">
                <Select name="categoryId" defaultValue={x.categoryId}>
                  <option value="">-</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Contact person" required error={state.errors?.contactName}>
                <Input name="contactName" defaultValue={x.contactName} />
              </Field>
              <Field label="Phone" required error={state.errors?.phone}>
                <Input name="phone" defaultValue={x.phone} />
              </Field>
              <Field label="Email" error={state.errors?.email}>
                <Input name="email" defaultValue={x.email} />
              </Field>
              <Field label="WhatsApp">
                <Input name="whatsapp" defaultValue={x.whatsapp} />
              </Field>
              <Field label="Hall">
                <Input name="hall" defaultValue={x.hall} />
              </Field>
              <Field label="Stand">
                <Input name="stand" defaultValue={x.stand} />
              </Field>
            </div>
            <div className="mt-4 space-y-4">
              <Field label="Description">
                <Textarea name="description" rows={4} defaultValue={x.description} />
              </Field>
              <Field label="Showcasing at KUZANA">
                <Textarea name="showcasing" rows={3} defaultValue={x.showcasing} />
              </Field>
              <Field label="Products / services">
                <Textarea name="products" rows={3} defaultValue={x.products} />
              </Field>
              <Field label="Address">
                <Input name="address" defaultValue={x.address} />
              </Field>
            </div>
          </Panel>
          <Panel title="Links">
            <div className="grid gap-4 sm:grid-cols-2">
              {(["website", "facebook", "instagram", "linkedin", "tiktok"] as const).map((k) => (
                <Field key={k} label={k[0].toUpperCase() + k.slice(1)} error={state.errors?.[k]}>
                  <Input name={k} defaultValue={x[k]} />
                </Field>
              ))}
            </div>
          </Panel>
          <Panel title="Opportunities">
            <div className="grid gap-2 sm:grid-cols-3">
              {OPPORTUNITIES.map((o) => (
                <Checkbox key={o} name="opportunities" value={o} label={o} defaultChecked={x.opportunities.includes(o)} />
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Looking for">
                <Textarea name="seeking" rows={3} defaultValue={x.seeking} />
              </Field>
              <Field label="Can offer">
                <Textarea name="offering" rows={3} defaultValue={x.offering} />
              </Field>
            </div>
          </Panel>
          {!readOnly && (
            <Panel title="Add files">
              <div key={round} className="grid gap-4 sm:grid-cols-2">
                <Uploader label="Logo" folder="exhibitors" onChange={setGroup("logo", "LOGO")} />
                <Uploader label="Booth photos" capture multiple folder="exhibitors" onChange={setGroup("booth", "BOOTH")} />
                <Uploader label="Product photos" capture multiple folder="exhibitors" onChange={setGroup("product", "PRODUCT")} />
                <Uploader label="Brochures / flyers" accept="any" multiple folder="exhibitors" onChange={setGroup("brochure", "BROCHURE")} />
              </div>
            </Panel>
          )}
          <Panel title="Internal notes">
            <Textarea name="reviewNotes" rows={3} defaultValue={x.reviewNotes} />
            <p className="mt-2 text-xs text-muted">Publishing consent: {x.consent ? "given" : "not recorded (staff capture)"}</p>
          </Panel>
          {!readOnly && (
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          )}
        </fieldset>
      )}
    </AdminForm>
  );
}
