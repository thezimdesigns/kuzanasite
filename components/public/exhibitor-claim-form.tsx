"use client";

import { useState } from "react";
import { completeExhibitorProfile } from "@/app/actions/public";
import { ActionForm } from "@/components/action-form";
import { Uploader, type UploadedFile } from "@/components/uploader";
import { Button, Card, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { OPPORTUNITIES } from "@/lib/options";
import type { ExhibitorMediaKind } from "@/lib/generated/prisma/enums";

type Values = Record<
  "name" | "contactName" | "phone" | "email" | "categoryId" | "hall" | "stand" | "description" | "showcasing" | "website" | "facebook" | "instagram" | "linkedin" | "tiktok" | "whatsapp" | "address" | "seeking" | "offering",
  string
> & { opportunities: string[]; mediaCount: number };

export function ExhibitorClaimForm({ token, sectors, exhibitor: x }: { token: string; sectors: { id: string; name: string }[]; exhibitor: Values }) {
  const [media, setMedia] = useState<Record<string, (UploadedFile & { kind: ExhibitorMediaKind })[]>>({});
  const all = Object.values(media).flat().map(({ preview: _p, ...m }) => m);
  const setGroup = (g: string, kind: ExhibitorMediaKind) => (files: UploadedFile[]) => setMedia((m) => ({ ...m, [g]: files.map((f) => ({ ...f, kind })) }));

  return (
    <ActionForm action={completeExhibitorProfile} className="space-y-6">
      {(state, pending) => (
        <>
          <input type="hidden" name="claim" value={token} />
          <input type="hidden" name="media" value={JSON.stringify(all)} />
          <Card className="space-y-4 p-5">
            <h2 className="font-heading text-lg font-bold text-green-900">Organisation</h2>
            <Field label="Organisation name" required error={state.errors?.name}>
              <Input name="name" defaultValue={x.name} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact person" required error={state.errors?.contactName}>
                <Input name="contactName" defaultValue={x.contactName} />
              </Field>
              <Field label="Mobile / WhatsApp" required error={state.errors?.phone}>
                <Input name="phone" type="tel" defaultValue={x.phone} />
              </Field>
              <Field label="Email" error={state.errors?.email}>
                <Input name="email" type="email" defaultValue={x.email} />
              </Field>
              <Field label="Sector">
                <Select name="categoryId" defaultValue={x.categoryId}>
                  <option value="">Choose…</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Hall">
                <Input name="hall" defaultValue={x.hall} />
              </Field>
              <Field label="Stand number">
                <Input name="stand" defaultValue={x.stand} />
              </Field>
            </div>
            <Field label="About your organisation">
              <Textarea name="description" rows={4} defaultValue={x.description} />
            </Field>
            <Field label="What are you showcasing?">
              <Textarea name="showcasing" rows={3} defaultValue={x.showcasing} />
            </Field>
          </Card>

          <Card className="space-y-5 p-5">
            <h2 className="font-heading text-lg font-bold text-green-900">Photos &amp; materials</h2>
            <p className="text-sm text-muted">You have {x.mediaCount} file(s) on your profile. New files are added to them.</p>
            <Uploader label="Logo" claim={token} onChange={setGroup("logo", "LOGO")} />
            <Uploader label="Stand photos" capture multiple max={4} claim={token} onChange={setGroup("booth", "BOOTH")} />
            <Uploader label="Product photos" capture multiple max={4} claim={token} onChange={setGroup("product", "PRODUCT")} />
            <Uploader label="Brochures & flyers" accept="any" multiple max={4} claim={token} onChange={setGroup("brochure", "BROCHURE")} />
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="font-heading text-lg font-bold text-green-900">Links</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["website", "facebook", "instagram", "linkedin", "tiktok"] as const).map((k) => (
                <Field key={k} label={k[0].toUpperCase() + k.slice(1)} error={state.errors?.[k]}>
                  <Input name={k} inputMode="url" defaultValue={x[k]} />
                </Field>
              ))}
              <Field label="WhatsApp business number">
                <Input name="whatsapp" type="tel" defaultValue={x.whatsapp} />
              </Field>
            </div>
            <Field label="Physical address">
              <Input name="address" defaultValue={x.address} />
            </Field>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="font-heading text-lg font-bold text-green-900">Opportunities</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {OPPORTUNITIES.map((o) => (
                <Checkbox key={o} name="opportunities" value={o} label={o} defaultChecked={x.opportunities.includes(o)} />
              ))}
            </div>
            <Field label="What opportunities are you looking for?">
              <Textarea name="seeking" rows={3} defaultValue={x.seeking} />
            </Field>
            <Field label="What can your organisation offer?">
              <Textarea name="offering" rows={3} defaultValue={x.offering} />
            </Field>
          </Card>

          <Checkbox
            name="consent"
            label="I confirm I am authorised to submit this information and give KUZANA SCEEZ permission to publish it."
          />
          {state.errors?.consent && <p className="text-xs font-semibold text-danger">{state.errors.consent}</p>}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </>
      )}
    </ActionForm>
  );
}
