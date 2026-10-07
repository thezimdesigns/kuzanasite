"use client";

import { startTransition, useActionState, useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import type { FormState } from "@/lib/forms";
import { Alert, Button, cn } from "@/components/ui";

type Action = (state: FormState, fd: FormData) => Promise<FormState>;

/**
 * Admin form wrapper. Submits without resetting fields (so nothing is lost on
 * a validation error) and shows the action's message.
 */
export function AdminForm({
  action,
  children,
  className,
  resetOnSuccess = false,
}: {
  action: Action;
  children: (state: FormState, pending: boolean) => ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [form, setForm] = useState<HTMLFormElement | null>(null);
  // Success messages fade after a few seconds; errors stay until the next submit.
  const [dismissed, setDismissed] = useState<FormState | null>(null);
  const showMessage = !!state.message && dismissed !== state;

  useEffect(() => {
    if (!state.ok) return;
    if (resetOnSuccess) form?.reset();
    const t = setTimeout(() => setDismissed(state), 4000);
    return () => clearTimeout(t);
  }, [state, form, resetOnSuccess]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  return (
    <form ref={setForm} onSubmit={onSubmit} className={className} noValidate>
      {showMessage && state.message && (
        <div className="mb-4">
          <Alert tone={state.ok ? "green" : "red"}>{state.message}</Alert>
        </div>
      )}
      {children(state, pending)}
    </form>
  );
}

/** A button that runs a bound server action, optionally after a confirmation. */
export function ActionButton({
  action,
  confirm,
  children,
  variant = "outline",
  size = "sm",
  className,
}: {
  action: () => Promise<unknown>;
  confirm?: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <span className={cn("inline-flex flex-col", className)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setError("");
          start(async () => {
            try {
              await action();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Something went wrong.");
            }
          });
        }}
      >
        {pending ? "Working…" : children}
      </Button>
      {error && <span className="mt-1 text-xs font-semibold text-danger">{error}</span>}
    </span>
  );
}
