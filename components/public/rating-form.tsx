"use client";

import { useState, useSyncExternalStore } from "react";
import { Star } from "lucide-react";
import { submitRating } from "@/app/actions/public";
import { ActionForm } from "@/components/action-form";
import { Button, cn, Textarea } from "@/components/ui";

type Target = { eventId?: string; sessionId?: string; exhibitorId?: string };

const storageKey = (t: Target) => `kuzana.rated.${t.sessionId ?? t.exhibitorId ?? t.eventId}`;
const noopSubscribe = () => () => {};

function alreadyRated(t: Target) {
  try {
    return localStorage.getItem(storageKey(t)) === "1";
  } catch {
    return false;
  }
}

/** 1–5 star rating with an optional comment. Remembers on this device that it was used. */
export function RatingForm({ label = "Rate this event", compact = false, ...target }: Target & { label?: string; compact?: boolean }) {
  const [stars, setStars] = useState(0);
  const rated = useSyncExternalStore(
    noopSubscribe,
    () => alreadyRated(target),
    () => false,
  );

  if (rated) return <p className="text-sm font-semibold text-green-900">Thanks, you&apos;ve rated this.</p>;

  return (
    <ActionForm
      action={submitRating}
      recaptchaAction="rating"
      onSuccess={() => {
        try {
          localStorage.setItem(storageKey(target), "1");
        } catch {}
      }}
      success={(s) => <p className="text-sm font-semibold text-green-900">{s.message}</p>}
      className="space-y-3"
    >
      {(state, pending) => (
        <>
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">{label}</legend>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  aria-pressed={stars === n}
                  className="rounded-[var(--radius-control)] p-1 transition-transform duration-150 hover:scale-110 active:scale-95"
                >
                  <Star className={cn(compact ? "size-6" : "size-8", "transition-colors", n <= stars ? "fill-gold text-gold" : "text-line")} />
                </button>
              ))}
            </div>
            {state.errors?.stars && <p className="text-xs font-semibold text-danger">{state.errors.stars}</p>}
          </fieldset>
          <input type="hidden" name="stars" value={stars || ""} />
          {target.eventId && <input type="hidden" name="eventId" value={target.eventId} />}
          {target.sessionId && <input type="hidden" name="sessionId" value={target.sessionId} />}
          {target.exhibitorId && <input type="hidden" name="exhibitorId" value={target.exhibitorId} />}
          {stars > 0 && <Textarea name="comment" rows={2} placeholder="Anything you'd like to add? (optional)" />}
          <Button type="submit" size="sm" variant="secondary" disabled={pending || !stars}>
            {pending ? "Sending…" : "Submit rating"}
          </Button>
        </>
      )}
    </ActionForm>
  );
}
