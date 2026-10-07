"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { registerVisitor } from "@/app/actions/public";
import { ActionForm } from "@/components/action-form";
import { PushOptIn } from "@/components/public/push-opt-in";
import { Button, ButtonLink, Card, Checkbox, Field, Input, Select } from "@/components/ui";
import { AGE_RANGES, VISITOR_INTERESTS, VISITOR_TYPES } from "@/lib/options";

export function VisitorRegistrationForm() {
  return (
    <ActionForm
      action={registerVisitor}
      recaptchaAction="visitor"
      onSuccess={(s) => {
        // Lets a later push opt-in link to this visitor record.
        try {
          if (s.id) localStorage.setItem("kuzana.visitorId", s.id);
        } catch {}
      }}
      success={(s) => (
        <Card className="space-y-4 p-6">
          <CheckCircle2 className="size-10 text-green-800" />
          <p className="font-heading text-xl font-bold text-green-900">{s.message}</p>
          <p className="text-muted">Want instant alerts for programme changes? Turn on browser notifications:</p>
          <PushOptIn />
          <div className="flex flex-wrap gap-3 pt-2">
            <ButtonLink href="/programme/today">Today&apos;s programme</ButtonLink>
            <ButtonLink href="/plan-your-visit" variant="outline">
              Plan your visit
            </ButtonLink>
          </div>
        </Card>
      )}
    >
      {(state, pending) => (
        <Card className="space-y-4 p-5">
          <Field label="Full name" required error={state.errors?.name}>
            <Input name="name" autoComplete="name" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mobile / WhatsApp" error={state.errors?.phone} hint="Mobile or email is required.">
              <Input name="phone" type="tel" inputMode="tel" autoComplete="tel" />
            </Field>
            <Field label="Email" error={state.errors?.email}>
              <Input name="email" type="email" autoComplete="email" />
            </Field>
          </div>
          <details className="rounded-[var(--radius-control)] bg-cream p-3">
            <summary className="cursor-pointer text-sm font-semibold">More about you (optional)</summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="I am a">
                <Select name="visitorType" defaultValue="">
                  <option value="">Choose…</option>
                  {VISITOR_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Organisation">
                <Input name="organisation" autoComplete="organization" />
              </Field>
              <Field label="City">
                <Input name="city" autoComplete="address-level2" />
              </Field>
              <Field label="Country">
                <Input name="country" autoComplete="country-name" defaultValue="Zimbabwe" />
              </Field>
              <Field label="Age range">
                <Select name="ageRange" defaultValue="">
                  <option value="">Prefer not to say</option>
                  {AGE_RANGES.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </details>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">I&apos;m interested in</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {VISITOR_INTERESTS.map((i) => (
                <Checkbox key={i} name="interests" value={i} label={i} />
              ))}
            </div>
          </fieldset>
          <div className="space-y-3 border-t border-line pt-4">
            <p className="text-sm font-semibold">How should we keep you updated?</p>
            <Checkbox name="emailConsent" label="Send me KUZANA updates by email (you can unsubscribe at any time)." />
            <p className="text-xs text-muted">Browser notifications can be turned on after you register.</p>
            <Checkbox
              name="consent"
              label={
                <>
                  I have read the{" "}
                  <Link href="/privacy" className="underline" target="_blank">
                    privacy notice
                  </Link>{" "}
                  and agree to KUZANA SCEEZ storing my registration.
                </>
              }
            />
            {state.errors?.consent && <p className="text-xs font-semibold text-danger">{state.errors.consent}</p>}
          </div>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Registering…" : "Register"}
          </Button>
        </Card>
      )}
    </ActionForm>
  );
}
