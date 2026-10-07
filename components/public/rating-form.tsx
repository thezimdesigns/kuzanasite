"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { submitRating } from "@/app/actions/public";
import { ActionForm } from "@/components/action-form";
import { Button, cn, Textarea } from "@/components/ui";

export function RatingForm({ eventId, sessionId, label = "Rate this event" }: { eventId?: string; sessionId?: string; label?: string }) {
  const [stars, setStars] = useState(0);
  return (
    <ActionForm
      action={submitRating}
      success={(s) => <p className="font-semibold text-green-900">{s.message}</p>}
      className="space-y-3"
    >
      {(state, pending) => (
        <>
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">{label}</legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  aria-pressed={stars === n}
                  className="p-1"
                >
                  <Star className={cn("size-8", n <= stars ? "fill-gold text-gold" : "text-line")} />
                </button>
              ))}
            </div>
            {state.errors?.stars && <p className="text-xs font-semibold text-danger">{state.errors.stars}</p>}
          </fieldset>
          <input type="hidden" name="stars" value={stars || ""} />
          {eventId && <input type="hidden" name="eventId" value={eventId} />}
          {sessionId && <input type="hidden" name="sessionId" value={sessionId} />}
          {stars > 0 && <Textarea name="comment" rows={2} placeholder="Anything you'd like to add? (optional)" />}
          <Button type="submit" size="sm" variant="secondary" disabled={pending || !stars}>
            {pending ? "Sending…" : "Submit rating"}
          </Button>
        </>
      )}
    </ActionForm>
  );
}
