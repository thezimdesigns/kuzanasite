"use client";

import { useState } from "react";
import { captureExhibitor } from "@/app/admin/actions/exhibitors";
import { AdminForm } from "@/components/admin/admin-form";
import { Uploader, type UploadedFile } from "@/components/uploader";
import { Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import type { ExhibitorMediaKind } from "@/lib/generated/prisma/enums";

export function CaptureExhibitorForm({ sectors }: { sectors: { id: string; name: string }[] }) {
  const [media, setMedia] = useState<Record<string, (UploadedFile & { kind: ExhibitorMediaKind })[]>>({});
  // Remounting the uploaders after each save clears them for the next stand.
  const [round, setRound] = useState(0);
  const all = Object.values(media)
    .flat()
    .map(({ preview: _p, ...m }) => m);
  const setGroup = (g: string, kind: ExhibitorMediaKind) => (files: UploadedFile[]) => setMedia((m) => ({ ...m, [g]: files.map((f) => ({ ...f, kind })) }));

  return (
    <AdminForm
      action={async (prev, fd) => {
        const result = await captureExhibitor(prev, fd);
        if (result.ok) {
          setMedia({});
          setRound((r) => r + 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return result;
      }}
      resetOnSuccess
      className="space-y-4"
    >
      {(state, pending) => (
        <>
          <input type="hidden" name="media" value={JSON.stringify(all)} />
          <Field label="Organisation name" required error={state.errors?.name}>
            <Input name="name" autoCapitalize="words" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact person" required error={state.errors?.contactName}>
              <Input name="contactName" autoCapitalize="words" />
            </Field>
            <Field label="Phone" required error={state.errors?.phone}>
              <Input name="phone" type="tel" inputMode="tel" />
            </Field>
          </div>
          <Field label="Sector">
            <Select name="categoryId" defaultValue="">
              <option value="">Choose…</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hall">
              <Input name="hall" />
            </Field>
            <Field label="Stand">
              <Input name="stand" />
            </Field>
          </div>
          <div key={round} className="space-y-4">
            <Uploader label="Booth photo" capture multiple max={3} folder="exhibitors" onChange={setGroup("booth", "BOOTH")} />
            <Uploader label="Flyer / business card photo" capture multiple max={3} folder="exhibitors" onChange={setGroup("flyer", "BUSINESS_CARD")} />
          </div>
          <details>
            <summary className="cursor-pointer text-sm font-semibold">More (optional)</summary>
            <div className="mt-3 space-y-3">
              <Field label="Email" error={state.errors?.email}>
                <Input name="email" type="email" />
              </Field>
              <Field label="Notes">
                <Textarea name="notes" rows={2} />
              </Field>
            </div>
          </details>
          <Checkbox name="publishNow" label="Publish to the exhibitor directory now (otherwise it waits for review)" />
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Save exhibitor"}
          </Button>
        </>
      )}
    </AdminForm>
  );
}
