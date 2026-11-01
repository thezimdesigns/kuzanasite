"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui";

/**
 * Choose several items from a long list (exhibitors, people): the chosen ones
 * as removable chips, the rest behind a type-to-filter search. Submits one
 * hidden input per chosen id under `name`.
 */
export function PickList({
  name,
  options,
  initial = [],
  placeholder,
}: {
  name: string;
  options: { id: string; label: string }[];
  initial?: string[];
  placeholder: string;
}) {
  const [chosen, setChosen] = useState<string[]>(initial);
  const [q, setQ] = useState("");
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o.label])), [options]);
  const matches =
    q.trim().length >= 2 ? options.filter((o) => !chosen.includes(o.id) && o.label.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8) : [];

  return (
    <div>
      {chosen.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      {chosen.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {chosen.map((id) => (
            <li
              key={id}
              className="inline-flex items-center gap-1 rounded-[var(--radius-badge)] bg-green-100 py-0.5 pr-1 pl-2 text-sm font-semibold text-green-900"
            >
              {byId.get(id) ?? "Unknown"}
              <button
                type="button"
                onClick={() => setChosen(chosen.filter((c) => c !== id))}
                aria-label={`Remove ${byId.get(id)}`}
                className="rounded p-0.5 hover:bg-green-200"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {matches.length > 0 && (
        <ul className="mt-1 max-h-56 overflow-y-auto rounded-[var(--radius-control)] border border-line bg-white">
          {matches.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => {
                  setChosen([...chosen, o.id]);
                  setQ("");
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-cream"
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
