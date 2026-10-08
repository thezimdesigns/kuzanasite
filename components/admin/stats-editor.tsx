"use client";

import { useState, useTransition, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { saveDailyReport } from "@/app/admin/actions/content";
import { Panel } from "@/components/admin/ui";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { formatNumber, groupTotal, type StatGroup } from "@/lib/stats";

type Row = { key: number; label: string; value: string };
type Group = { key: number; title: string; note: string; showTotal: boolean; items: Row[] };

let nextKey = 1;
const key = () => nextKey++;

export function StatsEditor({
  id,
  dayLabel,
  initial,
}: {
  id: string;
  dayLabel: string;
  initial: { headline: string; note: string; publishStatus: string; groups: StatGroup[] };
}) {
  const [headline, setHeadline] = useState(initial.headline);
  const [note, setNote] = useState(initial.note);
  const [status, setStatus] = useState(initial.publishStatus);
  const [groups, setGroups] = useState<Group[]>(() =>
    initial.groups.map((g) => ({
      key: key(),
      title: g.title,
      note: g.note ?? "",
      showTotal: g.showTotal,
      items: g.items.map((i) => ({ key: key(), label: i.label, value: i.value ? String(i.value) : "" })),
    })),
  );
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();

  const patchGroup = (k: number, patch: Partial<Group>) => setGroups((gs) => gs.map((g) => (g.key === k ? { ...g, ...patch } : g)));
  const patchRow = (gk: number, rk: number, patch: Partial<Row>) =>
    setGroups((gs) => gs.map((g) => (g.key === gk ? { ...g, items: g.items.map((r) => (r.key === rk ? { ...r, ...patch } : r)) } : g)));
  const moveGroup = (i: number, d: -1 | 1) =>
    setGroups((gs) => {
      const next = [...gs];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });

  const toNumber = (v: string) => Number(v.replace(/[^\d]/g, "") || 0);

  function save(publish?: boolean) {
    const publishStatus = publish === undefined ? status : publish ? "PUBLISHED" : "DRAFT";
    setStatus(publishStatus);
    start(async () => {
      try {
        setResult(
          await saveDailyReport(id, {
            headline,
            note,
            publishStatus: publishStatus as "PUBLISHED" | "DRAFT",
            groups: groups.map((g) => ({ title: g.title, note: g.note.trim() || undefined, showTotal: g.showTotal, items: g.items.map((r) => ({ label: r.label, value: toNumber(r.value) })) })),
          }),
        );
      } catch (e) {
        setResult({ ok: false, message: e instanceof Error ? e.message : "Could not save." });
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        {groups.map((g, gi) => {
          const total = groupTotal({ title: g.title, showTotal: g.showTotal, items: g.items.map((r) => ({ label: r.label, value: toNumber(r.value) })) });
          return (
            <Panel
              key={g.key}
              actions={
                <div className="flex items-center gap-1">
                  <IconButton label="Move group up" disabled={gi === 0} onClick={() => moveGroup(gi, -1)}>
                    <ArrowUp className="size-4" />
                  </IconButton>
                  <IconButton label="Move group down" disabled={gi === groups.length - 1} onClick={() => moveGroup(gi, 1)}>
                    <ArrowDown className="size-4" />
                  </IconButton>
                  <IconButton
                    label="Remove group"
                    danger
                    onClick={() => confirm(`Remove "${g.title || "this group"}"?`) && setGroups((gs) => gs.filter((x) => x.key !== g.key))}
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              }
              title={
                <input
                  value={g.title}
                  onChange={(e) => patchGroup(g.key, { title: e.target.value })}
                  placeholder="Group title, e.g. Exhibitors"
                  aria-label="Group title"
                  className="w-full min-w-[16rem] rounded-[var(--radius-control)] border border-transparent bg-transparent px-1.5 py-0.5 font-heading text-lg font-bold text-green-900 hover:border-line focus:border-green-800 focus:outline-none"
                />
              }
            >
              <input
                value={g.note}
                onChange={(e) => patchGroup(g.key, { note: e.target.value })}
                placeholder="Note, e.g. Creative Economy Conference, Hall 2 (optional)"
                aria-label="Group note"
                maxLength={120}
                className="-mt-2 mb-3 w-full rounded-[var(--radius-control)] border border-line bg-cream/60 px-3 py-1.5 text-sm placeholder:text-[#767676] focus:border-green-800 focus:outline-none"
              />
              <ul className="space-y-2">
                {g.items.map((r) => (
                  <li key={r.key} className="grid grid-cols-[1fr_8.5rem_auto] items-center gap-2">
                    <Input value={r.label} onChange={(e) => patchRow(g.key, r.key, { label: e.target.value })} placeholder="Label, e.g. Sport" aria-label="Label" />
                    <Input
                      value={r.value}
                      onChange={(e) => patchRow(g.key, r.key, { value: e.target.value.replace(/[^\d]/g, "") })}
                      inputMode="numeric"
                      placeholder="0"
                      aria-label={`${r.label || "Figure"} value`}
                      className="text-right font-heading text-lg font-bold tabular-nums"
                    />
                    <IconButton
                      label="Remove figure"
                      danger
                      disabled={g.items.length === 1}
                      onClick={() => patchGroup(g.key, { items: g.items.filter((x) => x.key !== r.key) })}
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <button
                  type="button"
                  onClick={() => patchGroup(g.key, { items: [...g.items, { key: key(), label: "", value: "" }] })}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-green-800 hover:underline"
                >
                  <Plus className="size-4" /> Add figure
                </button>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={g.showTotal} onChange={(e) => patchGroup(g.key, { showTotal: e.target.checked })} className="size-4 accent-green-800" />
                    Show total
                  </label>
                  {g.showTotal && (
                    <span className="font-heading font-bold text-green-900 tabular-nums">
                      Total {formatNumber(total)}
                    </span>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
        <Button
          type="button"
          variant="outline"
          onClick={() => setGroups((gs) => [...gs, { key: key(), title: "", note: "", showTotal: false, items: [{ key: key(), label: "", value: "" }] }])}
        >
          <Plus className="size-4" /> Add group
        </Button>
      </div>

      <div className="space-y-4">
        <Panel title={dayLabel}>
          <div className="space-y-3">
            <Field label="Headline (optional)" hint="e.g. Over 600 delegates on day one">
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={160} />
            </Field>
            <Field label="Note (optional)" hint="Shown under the figures, e.g. how they were counted.">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} />
            </Field>
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="DRAFT">Draft (not shown)</option>
                <option value="PUBLISHED">Published</option>
              </Select>
            </Field>
            {result && <Alert tone={result.ok ? "green" : "red"}>{result.message}</Alert>}
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => save()} disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
              {status !== "PUBLISHED" && (
                <Button type="button" variant="secondary" onClick={() => save(true)} disabled={pending}>
                  Save and publish
                </Button>
              )}
            </div>
            <p className="text-xs text-muted">Published figures appear on the homepage and at /stats. The latest published day leads.</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`rounded p-1.5 text-muted disabled:opacity-30 ${danger ? "hover:bg-danger-50 hover:text-danger" : "hover:bg-cream hover:text-ink"}`}
    >
      {children}
    </button>
  );
}
