"use client";

import { useTransition, useState } from "react";
import { setAutoApprove } from "@/app/admin/actions/engagement";
import { cn } from "@/components/ui";

/** Switch: show questions without waiting for approval. */
export function AutoApproveToggle({ on }: { on: boolean }) {
  const [value, setValue] = useState(on);
  const [pending, start] = useTransition();
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <span>
        <span className="block font-semibold">Show questions straight away</span>
        <span className="block text-xs text-muted">Off: each question waits for approval. You can still hide any question.</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          setValue(next);
          start(() => setAutoApprove(next).then(() => undefined));
        }}
      />
      <span
        aria-hidden
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-orange-dark",
          value ? "bg-green-800" : "bg-line",
        )}
      >
        <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", value && "translate-x-5")} />
      </span>
    </label>
  );
}
