"use client";

import { useOptimistic, useTransition } from "react";
import { setNavLinkVisible } from "@/app/admin/actions/site";
import { cn } from "@/components/ui";

/** On/off switch for one menu link. Flips at once and saves in the background. */
export function NavToggle({ href, label, visible, disabled }: { href: string; label: string; visible: boolean; disabled?: boolean }) {
  const [pending, start] = useTransition();
  const [on, setOn] = useOptimistic(visible);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`Show ${label} in the menu`}
      disabled={disabled || pending}
      onClick={() =>
        start(async () => {
          setOn(!on);
          await setNavLinkVisible(href, !on);
        })
      }
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-60",
        on ? "bg-green-800" : "bg-line",
      )}
    >
      <span className={cn("inline-block size-5 rounded-full bg-white shadow transition-transform duration-200", on ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}
