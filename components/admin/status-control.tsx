"use client";

import { useState, useTransition } from "react";
import { setEventStatus } from "@/app/admin/actions/programme";
import type { ProgrammeStatus } from "@/lib/generated/prisma/enums";
import { STATUS_LABELS } from "@/lib/time";

/** Quick live-status override for the events list. */
export function StatusControl({ id, value, note }: { id: string; value: ProgrammeStatus | null; note: string | null }) {
  const [pending, start] = useTransition();
  const [current, setCurrent] = useState(value ?? "");
  return (
    <select
      value={current}
      disabled={pending}
      aria-label="Live status"
      className="rounded-md border border-line bg-white px-2 py-1 text-xs"
      onChange={(e) => {
        const next = e.target.value as ProgrammeStatus | "";
        let newNote = note ?? undefined;
        if (next === "POSTPONED" || next === "CANCELLED" || next === "VENUE_CHANGED") {
          const answer = window.prompt("Public note (optional), e.g. new time or venue:", note ?? "");
          if (answer === null) return;
          newNote = answer || undefined;
        } else if (!next) {
          newNote = undefined;
        }
        setCurrent(next);
        start(() => setEventStatus(id, next || null, newNote).then(() => undefined));
      }}
    >
      <option value="">Automatic</option>
      {Object.entries(STATUS_LABELS).map(([k, label]) => (
        <option key={k} value={k}>
          {label}
        </option>
      ))}
    </select>
  );
}
