"use client";

import { startTransition, useActionState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import type { FormState } from "@/lib/forms";
import { Alert } from "@/components/ui";
import { playSfx } from "@/components/public/sfx";
import { useRecaptcha } from "@/components/public/use-recaptcha";

type Action = (state: FormState, fd: FormData) => Promise<FormState>;

/**
 * Wraps a server action form: adds the reCAPTCHA token and honeypot,
 * keeps typed values on error, and swaps to a success panel when done.
 */
export function ActionForm({
  action,
  recaptchaAction,
  children,
  success,
  className,
  keepFormOnSuccess = false,
  onSuccess,
}: {
  action: Action;
  recaptchaAction?: string;
  children: (state: FormState, pending: boolean) => ReactNode;
  success?: (state: FormState) => ReactNode;
  className?: string;
  keepFormOnSuccess?: boolean;
  onSuccess?: (state: FormState) => void;
}) {
  const getToken = useRecaptcha();
  const [state, formAction, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const next = await action(prev, fd);
    if (next.ok) {
      playSfx("drum");
      onSuccess?.(next);
    }
    return next;
  }, {});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (recaptchaAction) fd.set("recaptchaToken", await getToken(recaptchaAction));
    startTransition(() => formAction(fd));
  }

  if (state.ok && !keepFormOnSuccess) {
    return (
      success?.(state) ?? (
        <div className="rounded-[var(--radius-card)] border border-green-800/30 bg-green-100 p-6 text-green-900">
          <CheckCircle2 className="mb-2 size-8" />
          <p className="font-heading text-lg font-bold">{state.message ?? "Done."}</p>
        </div>
      )
    );
  }

  return (
    <form onSubmit={onSubmit} className={className} noValidate>
      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input type="text" name="website_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state.message && (
        <div className="mb-4">
          <Alert tone={state.ok ? "green" : "red"}>{state.message}</Alert>
        </div>
      )}
      {children(state, pending)}
    </form>
  );
}
