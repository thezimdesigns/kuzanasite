"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useTransition } from "react";
import { Search, Trash2 } from "lucide-react";
import { addStall, deleteStall, moveStall, updateStall } from "@/app/admin/actions/exhibitors";
import { Panel } from "@/components/admin/ui";
import { Alert, Field, Input, Select } from "@/components/ui";

const FloorPlanView = dynamic(() => import("@/components/map/floor-plan-view").then((m) => m.FloorPlanView), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse bg-cream-dark" />,
});

type Stall = {
  id: string;
  label: string;
  x: number;
  y: number;
  exhibitorId: string | null;
};
type Exhibitor = { id: string; name: string; stand: string | null };

/** "B12" → "B13", "7" → "8"; anything without a trailing number stays as is. */
function nextLabel(label: string) {
  const m = label.match(/^(.*?)(\d+)$/);
  if (!m) return label;
  return m[1] + String(Number(m[2]) + 1).padStart(m[2].length, "0");
}

export function FloorPlanEditor({
  plan,
  stalls,
  exhibitors,
}: {
  plan: { id: string; imageUrl: string; width: number; height: number };
  stalls: Stall[];
  exhibitors: Exhibitor[];
}) {
  const [label, setLabel] = useState(() => (stalls.length ? nextLabel(stalls.at(-1)!.label) : "1"));
  // undefined = use the suggestion for this stand number; "" = nobody yet.
  const [choice, setChoice] = useState<string | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const byId = useMemo(() => new Map(exhibitors.map((e) => [e.id, e])), [exhibitors]);
  const placed = useMemo(() => new Set(stalls.map((s) => s.exhibitorId).filter(Boolean)), [stalls]);

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      setError("");
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });

  function place(p: { x: number; y: number }) {
    if (!label.trim()) return setError("Enter a stand number first.");
    run(async () => {
      await addStall({
        floorPlanId: plan.id,
        label,
        exhibitorId: exhibitorId || null,
        ...p,
      });
      setLabel(nextLabel(label));
      setChoice(undefined);
    });
  }

  // Exhibitors whose registered stand matches the label are offered first.
  const suggested = exhibitors.find((e) => e.stand && e.stand.trim().toLowerCase() === label.trim().toLowerCase() && !placed.has(e.id));
  const exhibitorId = choice ?? suggested?.id ?? "";
  const q = filter.trim().toLowerCase();
  const list = stalls
    .filter(
      (s) =>
        !q ||
        s.label.toLowerCase().includes(q) ||
        byId
          .get(s.exhibitorId ?? "")
          ?.name.toLowerCase()
          .includes(q),
    )
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <div className="space-y-3">
        <div className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-white p-3 sm:grid-cols-[8rem_1fr]">
          <Field label="Next stand number">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={20} />
          </Field>
          <Field label="Exhibitor at this stand">
            <Select value={exhibitorId} onChange={(e) => setChoice(e.target.value)}>
              <option value="">Not assigned yet</option>
              {exhibitors.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                  {e.stand ? ` (stand ${e.stand})` : ""}
                  {placed.has(e.id) ? " ✓" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <p className="text-sm text-muted sm:col-span-2">
            Click the plan where stand <strong className="text-ink">{label || "…"}</strong> is. Drag a marker to move it. The number counts up after each click.
          </p>
        </div>
        {error && <Alert tone="red">{error}</Alert>}
        <div className="relative h-[70dvh] min-h-[420px] overflow-hidden rounded-[var(--radius-card)] border border-line">
          <FloorPlanView
            key={plan.imageUrl}
            imageUrl={plan.imageUrl}
            width={plan.width}
            height={plan.height}
            className="h-full"
            stalls={stalls.map((s) => ({
              id: s.id,
              label: s.label,
              x: s.x,
              y: s.y,
              empty: !s.exhibitorId,
              title: byId.get(s.exhibitorId ?? "")?.name,
            }))}
            highlight={selectedId ? new Set([selectedId]) : undefined}
            onPlanClick={(p) => !pending && place(p)}
            onStallDrag={(id, p) => run(() => moveStall(id, p.x, p.y))}
            onStallClick={setSelectedId}
          />
          {pending && (
            <span className="absolute top-3 right-3 rounded-[var(--radius-badge)] bg-green-900 px-2 py-1 text-xs font-semibold text-white">Saving…</span>
          )}
        </div>
      </div>

      <Panel title={`Stands (${stalls.length})`}>
        <label className="relative mb-3 block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Find a stand or exhibitor"
            className="pl-9"
            aria-label="Find a stand or exhibitor"
          />
        </label>
        <ul className="max-h-[60dvh] divide-y divide-line overflow-y-auto">
          {list.map((s) => (
            <StallRow
              key={`${s.id}-${s.label}-${s.exhibitorId}`}
              stall={s}
              exhibitors={exhibitors}
              selected={s.id === selectedId}
              onSelect={() => setSelectedId(s.id)}
              onSave={(l, ex) => run(() => updateStall(s.id, l, ex))}
              onDelete={() => confirm(`Remove stand ${s.label}?`) && run(() => deleteStall(s.id))}
            />
          ))}
          {stalls.length === 0 && <li className="py-2 text-sm text-muted">No stands yet. Click the plan to add the first one.</li>}
        </ul>
      </Panel>
    </div>
  );
}

function StallRow({
  stall,
  exhibitors,
  selected,
  onSelect,
  onSave,
  onDelete,
}: {
  stall: Stall;
  exhibitors: Exhibitor[];
  selected: boolean;
  onSelect: () => void;
  onSave: (label: string, exhibitorId: string | null) => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(stall.label);
  return (
    <li className={selected ? "-mx-2 bg-orange-50 px-2 py-2" : "py-2"} onFocusCapture={onSelect}>
      <div className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => label.trim() && label !== stall.label && onSave(label, stall.exhibitorId)}
          aria-label="Stand number"
          className="h-9 px-2 text-sm font-bold"
        />
        <Select
          defaultValue={stall.exhibitorId ?? ""}
          onChange={(e) => onSave(label, e.target.value || null)}
          aria-label={`Exhibitor at stand ${stall.label}`}
          className="h-9 text-sm"
        >
          <option value="">Not assigned</option>
          {exhibitors.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </Select>
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-1.5 text-muted hover:bg-danger-50 hover:text-danger"
          aria-label={`Remove stand ${stall.label}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}
