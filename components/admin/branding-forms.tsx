"use client";

import { addHeroSlide, saveLogo } from "@/app/admin/actions/content";
import { AdminForm } from "@/components/admin/admin-form";
import { UploadField } from "@/components/admin/upload-field";
import { Button, Field, Input } from "@/components/ui";

export function LogoForm({ current }: { current: string }) {
  return (
    <AdminForm action={saveLogo}>
      {(_, pending) => (
        <div className="space-y-3">
          <UploadField name="logoKey" label="Upload a new logo (PNG or WebP with a transparent background)" current={current} folder="branding" maxDim={1200} />
          <p className="text-xs text-muted">Remove the current file and save to go back to the original KUZANA SCEEZ logo.</p>
          <Button type="submit" size="sm" disabled={pending}>
            Save logo
          </Button>
        </div>
      )}
    </AdminForm>
  );
}

export function HeroSlideForm() {
  return (
    <AdminForm action={addHeroSlide} resetOnSuccess>
      {(state, pending) => (
        <div className="space-y-3">
          <UploadField name="imageKey" label="Photo" folder="hero" maxDim={2400} />
          {state.errors?.imageKey && <p className="text-xs font-semibold text-danger">Choose a photo first.</p>}
          <Field label="Describe the photo" hint="For people using screen readers.">
            <Input name="alt" placeholder="e.g. Crowd at the Boxing Match, ZITF" />
          </Field>
          <Button type="submit" size="sm" disabled={pending}>
            Add to homepage
          </Button>
        </div>
      )}
    </AdminForm>
  );
}
