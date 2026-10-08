"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { InterestForm } from "@/components/public/interest-form";
import { cn } from "@/components/ui";

const ROLES = ["Exhibitor", "Sponsor", "Speaker", "Artist", "Athlete", "Investor", "Partner"];
const OTHER = "Something else";

/**
 * "Stay connected" as a compact row of roles. Picking one opens the full form
 * underneath with that role already chosen, so the homepage only spends space
 * on the form when a visitor asks for it.
 */
export function InterestPanel() {
  const [role, setRole] = useState<string | null>(null);
  const open = role !== null;
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();

  // Bring the opened form into view and put the cursor in the first field.
  useEffect(() => {
    if (!open || !panel.current) return;
    const el = panel.current;
    const t = setTimeout(() => {
      el.querySelector<HTMLInputElement>('input[name="name"]')?.focus({ preventScroll: true });
      el.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }, 180);
    return () => clearTimeout(t);
  }, [open, role]);

  return (
    <div>
      <p className="mb-2.5 text-sm font-semibold text-white/65" aria-hidden>
        I&apos;d like to take part as…
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="I would like to take part as">
        {[...ROLES, OTHER].map((r) => {
          const active = role === r;
          return (
            <button
              key={r}
              type="button"
              aria-pressed={active}
              aria-controls={id}
              onClick={() => setRole(active ? null : r)}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border px-3.5 py-2 font-heading text-[0.95rem] font-bold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.97]",
                active
                  ? "border-orange-bright bg-orange-bright text-green-950"
                  : "border-white/30 text-white hover:border-white hover:bg-white/10",
                r === OTHER && !active && "border-dashed",
              )}
            >
              {r}
              {!active && <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />}
            </button>
          );
        })}
      </div>

      {/* Height animates from 0 with the grid-rows trick; inert keeps hidden fields out of the tab order. */}
      <div
        id={id}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-out-expo)] motion-reduce:transition-none",
          open ? "mt-6 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
        inert={!open}
      >
        <div className="min-h-0 overflow-hidden">
          <div ref={panel} className="scroll-mt-28 rounded-[var(--radius-card)] bg-white p-5 text-ink sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <p className="font-heading text-lg font-bold text-green-900">
                {role && role !== OTHER ? (
                  <>
                    Register your interest as {/^[AEIOU]/.test(role) ? "an" : "a"} <span className="text-orange-dark">{role.toLowerCase()}</span>
                  </>
                ) : (
                  "Register your interest"
                )}
              </p>
              <button
                type="button"
                onClick={() => setRole(null)}
                className="-mt-1 -mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-muted transition-colors hover:bg-cream hover:text-ink"
                aria-label="Close the form"
              >
                <X className="size-5" />
              </button>
            </div>
            <InterestForm interest={role && role !== OTHER ? role : ""} />
          </div>
        </div>
      </div>
    </div>
  );
}
