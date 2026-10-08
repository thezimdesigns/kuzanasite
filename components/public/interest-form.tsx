"use client";

import { submitInterest } from "@/app/actions/public";
import { ActionForm } from "@/components/action-form";
import { Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { INTEREST_TYPES } from "@/lib/options";

export function InterestForm() {
  return (
    <ActionForm action={submitInterest} recaptchaAction="interest" className="grid gap-4 sm:grid-cols-2">
      {(state, pending) => (
        <>
          <Field label="Full name" required error={state.errors?.name}>
            <Input name="name" autoComplete="name" />
          </Field>
          <Field label="Organisation">
            <Input name="organisation" autoComplete="organization" />
          </Field>
          <Field label="Email" error={state.errors?.email}>
            <Input name="email" type="email" autoComplete="email" />
          </Field>
          <Field label="Phone / WhatsApp" error={state.errors?.phone}>
            <Input name="phone" type="tel" autoComplete="tel" />
          </Field>
          <Field label="I am interested as a" required error={state.errors?.interest}>
            <Select name="interest" defaultValue="">
              <option value="" disabled>
                Choose…
              </option>
              {INTEREST_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Country">
            <Input name="country" autoComplete="country-name" />
          </Field>
          <Field label="Message" className="sm:col-span-2">
            <Textarea name="message" rows={3} />
          </Field>
          <div className="sm:col-span-2">
            <Checkbox name="consent" label="I agree that KUZANA SCEEZ may contact me about future editions and opportunities." />
            {state.errors?.consent && <p className="mt-1 text-xs font-semibold text-danger">{state.errors.consent}</p>}
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending} size="lg">
              {pending ? "Sending…" : "Submit interest"}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}
