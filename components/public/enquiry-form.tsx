"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { submitEnquiry } from "@/app/actions/public";
import { ActionForm } from "@/components/action-form";
import { Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { ENQUIRY_TOPICS } from "@/lib/options";

/**
 * "Send an enquiry" on an exhibitor's profile. Enquiries are kept by KUZANA and
 * forwarded to the exhibitor together after the expo.
 */
export function EnquiryForm({ exhibitorId, exhibitorName }: { exhibitorId: string; exhibitorName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <h2 className="font-heading text-lg font-bold text-green-900">Send an enquiry</h2>
      <p className="mt-1 text-sm text-muted">Interested in what {exhibitorName} offers? Leave your details and KUZANA will pass your enquiry on to them.</p>
      {!open ? (
        <Button type="button" size="sm" className="mt-4" onClick={() => setOpen(true)}>
          <Send className="size-4" aria-hidden /> Write an enquiry
        </Button>
      ) : (
        <ActionForm
          action={submitEnquiry}
          recaptchaAction="enquiry"
          className="mt-4"
          success={(s) => (
            <div className="rounded-[var(--radius-control)] border border-green-800/30 bg-green-100 p-4 text-sm text-green-900">
              <CheckCircle2 className="mb-1.5 size-6" aria-hidden />
              <p className="font-semibold">{s.message}</p>
            </div>
          )}
        >
          {(state, pending) => (
            <div className="space-y-3.5">
              <input type="hidden" name="exhibitorId" value={exhibitorId} />
              <Field label="What is it about?" required error={state.errors?.topic}>
                <Select name="topic" defaultValue="">
                  <option value="" disabled>
                    Choose…
                  </option>
                  {ENQUIRY_TOPICS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Your message" required error={state.errors?.message}>
                <Textarea name="message" rows={4} maxLength={2000} placeholder="What would you like to know or discuss?" />
              </Field>
              <Field label="Your name" required error={state.errors?.name}>
                <Input name="name" autoComplete="name" />
              </Field>
              <Field label="Organisation">
                <Input name="organisation" autoComplete="organization" />
              </Field>
              <Field label="Email" error={state.errors?.email} hint="An email or a phone number, so they can reply.">
                <Input name="email" type="email" autoComplete="email" />
              </Field>
              <Field label="Phone / WhatsApp" error={state.errors?.phone}>
                <Input name="phone" type="tel" autoComplete="tel" />
              </Field>
              <div>
                <Checkbox name="consent" label={`Share my enquiry and contact details with ${exhibitorName} so they can reply.`} />
                {state.errors?.consent && <p className="mt-1 text-xs font-semibold text-danger">{state.errors.consent}</p>}
              </div>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Sending…" : "Send enquiry"}
              </Button>
            </div>
          )}
        </ActionForm>
      )}
    </div>
  );
}
