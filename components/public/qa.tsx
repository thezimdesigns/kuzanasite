"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronUp, Lightbulb, MessageCircleQuestion } from "lucide-react";
import { askQuestion, voteQuestion } from "@/app/actions/public";
import { ActionForm } from "@/components/action-form";
import { Button, cn, Field, Input, Select, Textarea } from "@/components/ui";

type SessionOption = { id: string; label: string };

/** Ask a question or share a contribution. After sending, offers to ask another. */
export function QaAskForm({ eventId, sessions, sessionId }: { eventId: string; sessions: SessionOption[]; sessionId: string | null }) {
  const [round, setRound] = useState(0);
  const [kind, setKind] = useState<"QUESTION" | "CONTRIBUTION">("QUESTION");
  const [length, setLength] = useState(0);
  const router = useRouter();
  const question = kind === "QUESTION";

  return (
    <ActionForm
      key={round}
      action={askQuestion}
      recaptchaAction="qa"
      onSuccess={() => router.refresh()}
      success={(state) => (
        <div className="rounded-[var(--radius-card)] border border-green-800/30 bg-green-100 p-5 text-green-900">
          <CheckCircle2 className="mb-2 size-7" aria-hidden />
          <p className="font-heading text-lg font-bold">{state.message}</p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setRound((r) => r + 1)}>
            {question ? "Ask another question" : "Share another contribution"}
          </Button>
        </div>
      )}
      className="space-y-4"
    >
      {(state, pending) => (
        <>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="kind" value={kind} />
          <div role="radiogroup" aria-label="What would you like to send?" className="grid grid-cols-2 gap-1 rounded-[var(--radius-control)] bg-cream-dark p-1">
            {(
              [
                ["QUESTION", "Ask a question", MessageCircleQuestion],
                ["CONTRIBUTION", "Share a contribution", Lightbulb],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={kind === value}
                data-fx="tap"
                onClick={() => setKind(value)}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-2px)] px-2 py-2 text-sm font-semibold transition-colors",
                  kind === value ? "bg-white text-green-900 shadow-sm" : "text-muted hover:text-ink",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden /> {label}
              </button>
            ))}
          </div>
          <Field label={question ? "For which session?" : "About which session?"}>
            <Select name="sessionId" defaultValue={sessionId ?? ""}>
              <option value="">The conference in general</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label={question ? "Your question" : "Your contribution"}
            required
            error={state.errors?.body}
            hint={question ? "One clear question works best. Other delegates can vote for it." : "An idea, comment or recommendation for the organisers and the conference report."}
          >
            <Textarea name="body" rows={4} maxLength={600} onChange={(e) => setLength(e.target.value.length)} />
          </Field>
          <p className={cn("-mt-3 text-right text-xs tabular-nums", length > 560 ? "text-orange-dark" : "text-muted")} aria-live="polite">
            {length}/600
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Your name (optional)">
              <Input name="name" autoComplete="name" maxLength={80} />
            </Field>
            <Field label="Organisation (optional)">
              <Input name="organisation" autoComplete="organization" maxLength={120} />
            </Field>
          </div>
          <Button type="submit" disabled={pending} size="lg" className="w-full">
            {pending ? "Sending…" : question ? "Send question" : "Send contribution"}
          </Button>
        </>
      )}
    </ActionForm>
  );
}

/** Upvote toggle: one vote per phone, counted on the server. */
export function VoteButton({ questionId, votes, voted }: { questionId: string; votes: number; voted: boolean }) {
  const [state, setState] = useState({ votes, voted });
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        aria-pressed={state.voted}
        aria-label={state.voted ? `Remove your vote (${state.votes} votes)` : `Vote for this question (${state.votes} votes)`}
        disabled={pending}
        data-fx={state.voted ? "none" : "drum"}
        onClick={() =>
          start(async () => {
            // Show the change at once; the server confirms the count.
            setState((s) => ({ votes: s.votes + (s.voted ? -1 : 1), voted: !s.voted }));
            const r = await voteQuestion(questionId);
            if (r.ok) setState({ votes: r.votes, voted: r.voted });
            else {
              setState({ votes, voted });
              setError(r.message);
            }
          })
        }
        className={cn(
          "flex w-14 flex-col items-center rounded-[var(--radius-control)] border py-1.5 transition-colors",
          state.voted ? "border-orange bg-orange text-white" : "border-line bg-white text-green-900 hover:border-green-800",
        )}
      >
        <ChevronUp className="size-5" aria-hidden />
        <span className="font-heading text-lg leading-none font-extrabold tabular-nums">{state.votes}</span>
      </button>
      {error && (
        <span role="status" className="mt-1 w-20 text-center text-[11px] text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
