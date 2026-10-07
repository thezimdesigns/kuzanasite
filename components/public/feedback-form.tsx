"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { submitFeedback } from "@/app/actions/public";
import { ActionForm } from "@/components/action-form";
import { Button, Card, Checkbox, cn, Field, Input, Select, Textarea } from "@/components/ui";
import { FEEDBACK_CATEGORIES } from "@/lib/options";

export function FeedbackForm({
  events,
  venues,
  defaultEventId,
}: {
  events: { id: string; title: string }[];
  venues: { id: string; name: string }[];
  defaultEventId: string;
}) {
  const [anonymous, setAnonymous] = useState(false);
  const [rating, setRating] = useState(0);
  return (
    <ActionForm action={submitFeedback} recaptchaAction="feedback">
      {(state, pending) => (
        <Card className="space-y-4 p-5">
          <Field label="What is it about?" required error={state.errors?.category}>
            <Select name="category" defaultValue="">
              <option value="" disabled>
                Choose a category…
              </option>
              {FEEDBACK_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Related event">
              <Select name="eventId" defaultValue={defaultEventId}>
                <option value="">Not specific</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Venue">
              <Select name="venueId" defaultValue="">
                <option value="">Not specific</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">Overall rating (optional)</legend>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n === rating ? 0 : n)} aria-label={`${n} stars`} aria-pressed={rating === n} className="p-1">
                  <Star className={cn("size-7", n <= rating ? "fill-gold text-gold" : "text-line")} />
                </button>
              ))}
            </div>
            <input type="hidden" name="rating" value={rating || ""} />
          </fieldset>
          <Field label="Your message" required error={state.errors?.message}>
            <Textarea name="message" rows={5} maxLength={4000} />
          </Field>
          <Checkbox name="anonymous" label="Send anonymously" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          {!anonymous && (
            <div className="space-y-4 rounded-[var(--radius-control)] bg-cream p-4">
              <Field label="Name">
                <Input name="name" autoComplete="name" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" error={state.errors?.email}>
                  <Input name="email" type="email" autoComplete="email" />
                </Field>
                <Field label="Phone / WhatsApp">
                  <Input name="phone" type="tel" autoComplete="tel" />
                </Field>
              </div>
              <Checkbox name="contactPermission" label="KUZANA may contact me about this message." />
            </div>
          )}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Sending…" : "Send feedback"}
          </Button>
        </Card>
      )}
    </ActionForm>
  );
}
