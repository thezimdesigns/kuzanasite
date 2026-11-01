"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePortal, setPhasePreview } from "@/app/admin/actions/site";
import { AdminForm } from "@/components/admin/admin-form";
import { Button, Checkbox, Field, Input, cn } from "@/components/ui";

/** Preview the public site as in event week or between editions, in this browser only. */
export function PhasePreview({ preview }: { preview: "live" | "between" | null }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const pick = (p: "live" | "between" | null) =>
    start(async () => {
      await setPhasePreview(p);
      router.refresh();
    });
  const options = [
    [null, "Automatic"],
    ["live", "Event week"],
    ["between", "Between editions"],
  ] as const;
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Preview the site as">
      {options.map(([value, label]) => (
        <button
          key={label}
          type="button"
          disabled={pending}
          aria-pressed={preview === value}
          onClick={() => pick(value)}
          className={cn(
            "rounded-[var(--radius-control)] border px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-60",
            preview === value ? "border-green-900 bg-green-900 text-white" : "border-line bg-white text-green-900 hover:border-green-800",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function PortalForm({ url, open, readOnly }: { url: string; open: boolean; readOnly?: boolean }) {
  return (
    <AdminForm action={savePortal}>
      {(state, pending) => (
        <fieldset disabled={readOnly} className="space-y-3">
          <Field label="Portal address" error={state.errors?.url} hint="Also reachable as kuzana.org.zw/portal.">
            <Input name="url" type="url" defaultValue={url} />
          </Field>
          <Checkbox name="open" defaultChecked={open} label="Applications are open: send exhibitors and sponsors straight to the portal" />
          {!readOnly && (
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Save portal settings"}
            </Button>
          )}
        </fieldset>
      )}
    </AdminForm>
  );
}
