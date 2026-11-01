"use client";

import { useState } from "react";
import { submitStory } from "@/app/actions/public";
import { ActionForm } from "@/components/action-form";
import { Uploader } from "@/components/uploader";
import { Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { RETURNING_OPTIONS, STORY_ROLES } from "@/lib/options";

export type StoryPrefill = {
  exhibitorId?: string;
  personId?: string;
  name?: string;
  organisation?: string;
  role?: string;
};

/** "Share your KUZANA story": what happened at the expo, what came of it, what's next. */
export function StoryForm({ prefill = {}, nextYear }: { prefill?: StoryPrefill; nextYear: number | null }) {
  const [photo, setPhoto] = useState("");
  return (
    <ActionForm action={submitStory} recaptchaAction="story" className="space-y-8">
      {(state, pending) => (
        <>
          {prefill.exhibitorId && <input type="hidden" name="exhibitorId" value={prefill.exhibitorId} />}
          {prefill.personId && <input type="hidden" name="personId" value={prefill.personId} />}
          <input type="hidden" name="photoKey" value={photo} />

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 font-heading text-lg font-bold text-green-900">About you</legend>
            <Field label="Your name" required error={state.errors?.name}>
              <Input name="name" autoComplete="name" defaultValue={prefill.name} />
            </Field>
            <Field label="Organisation, brand or team">
              <Input name="organisation" autoComplete="organization" defaultValue={prefill.organisation} />
            </Field>
            <Field label="Email" error={state.errors?.email} hint="An email or a phone number, so we can follow up.">
              <Input name="email" type="email" autoComplete="email" />
            </Field>
            <Field label="Phone / WhatsApp">
              <Input name="phone" type="tel" autoComplete="tel" />
            </Field>
            <Field label="How did you take part?" required error={state.errors?.role} className="sm:col-span-2">
              <Select name="role" defaultValue={prefill.role ?? ""}>
                <option value="" disabled>
                  Choose…
                </option>
                {STORY_ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            </Field>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-3 font-heading text-lg font-bold text-green-900">Your story</legend>
            <Field label="What did you do or show at KUZANA?" required error={state.errors?.tookPart}>
              <Textarea name="tookPart" rows={3} maxLength={3000} placeholder="Your stand, talk, performance, match…" />
            </Field>
            <Field label="What came out of it?" hint="Deals, sales, contacts, bookings, partnerships, ideas. Numbers help.">
              <Textarea name="outcomes" rows={4} maxLength={4000} />
            </Field>
            <Field label="What are you working on now?" hint="A project, product, season or release people should know about.">
              <Textarea name="workingOn" rows={4} maxLength={4000} />
            </Field>
            <div>
              <p className="mb-1.5 text-sm font-semibold text-ink">A photo (optional)</p>
              <Uploader label="Add a photo" scope="story" onChange={(files) => setPhoto(files[0]?.key ?? "")} compact />
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 font-heading text-lg font-bold text-green-900">{nextYear ? `KUZANA SCEEZ ${nextYear}` : "The next edition"}</legend>
            <Field label="Will you be back?" hint="A yes registers your interest, and we'll contact you when applications open.">
              <Select name="returning" defaultValue="">
                <option value="">Prefer not to say</option>
                {RETURNING_OPTIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            </Field>
          </fieldset>

          <div>
            <Checkbox name="consent" label="KUZANA SCEEZ may publish my story (edited for length, with my name) and contact me about it." />
            {state.errors?.consent && <p className="mt-1 text-xs font-semibold text-danger">{state.errors.consent}</p>}
          </div>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Sending…" : "Share my story"}
          </Button>
        </>
      )}
    </ActionForm>
  );
}
