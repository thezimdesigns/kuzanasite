"use client";

import dynamic from "next/dynamic";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import {
  addRoutePoint,
  addRoutePointFromLink,
  createRoute,
  deleteRoute,
  deleteRoutePoint,
  moveRoutePoint,
  reorderRoutePoint,
  updateRoutePoint,
} from "@/app/admin/actions/programme";
import { AdminForm } from "@/components/admin/admin-form";
import { Panel } from "@/components/admin/ui";
import { Alert, Button, cn, Field, Input, Select } from "@/components/ui";
import type { RoutePointKind } from "@/lib/generated/prisma/enums";
import { routeMarkers } from "@/components/map/route-markers";

const MapView = dynamic(() => import("@/components/map/map-view").then((m) => m.MapView), { ssr: false });

export type EditorRoute = {
  id: string;
  name: string;
  distanceKm: number | null;
  color: string;
  points: {
    id: string;
    kind: RoutePointKind;
    label: string | null;
    lat: number;
    lng: number;
  }[];
};

const PRESETS = [
  { name: "5 km", distanceKm: 5, color: "#0e8a4f" },
  { name: "10 km", distanceKm: 10, color: "#1d6fd1" },
  { name: "21.1 km", distanceKm: 21.1, color: "#c89b2b" },
  { name: "42.2 km", distanceKm: 42.2, color: "#d4381c" },
];

const KIND_LABELS: Record<RoutePointKind, string> = {
  START: "Start",
  TURN: "Turning point",
  WAYPOINT: "Route point",
  FINISH: "Finish",
};

export function RouteEditor({ eventId, routes }: { eventId: string; routes: EditorRoute[] }) {
  const [selectedId, setSelectedId] = useState(routes[0]?.id ?? "");
  const [kind, setKind] = useState<RoutePointKind>("START");
  const [label, setLabel] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const selected = routes.find((r) => r.id === selectedId) ?? routes[0];

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      setError("");
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });

  // After placing a start, the next sensible click is along the route.
  const afterAdd = () => {
    setLabel("");
    if (kind === "START") setKind("TURN");
  };

  const { markers, lines } = routeMarkers(routes, {
    editableRouteId: selected?.id,
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
      <div className="space-y-6">
        <Panel title="Routes">
          {routes.length === 0 && <p className="mb-3 text-sm text-muted">Add a route for each race distance.</p>}
          <ul className="space-y-1.5">
            {routes.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[var(--radius-control)] border px-3 py-2 text-left text-sm",
                    r.id === selected?.id ? "border-green-900 bg-green-100" : "border-line bg-white hover:border-green-800/50",
                  )}
                >
                  <span className="size-3 shrink-0 rounded-full" style={{ background: r.color }} aria-hidden />
                  <span className="flex-1 font-semibold">{r.name}</span>
                  <span className="text-xs text-muted">{r.points.length} points</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-line pt-4">
            <p className="mb-2 text-sm font-semibold">Add a route</p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {PRESETS.filter((p) => !routes.some((r) => r.name === p.name)).map((p) => (
                <form key={p.name} action={async (fd) => run(() => createRoute({}, fd))}>
                  <input type="hidden" name="eventId" value={eventId} />
                  <input type="hidden" name="name" value={p.name} />
                  <input type="hidden" name="distanceKm" value={p.distanceKm} />
                  <input type="hidden" name="color" value={p.color} />
                  <input type="hidden" name="sortOrder" value={p.distanceKm} />
                  <Button type="submit" size="sm" variant="outline" disabled={pending}>
                    + {p.name}
                  </Button>
                </form>
              ))}
            </div>
            <AdminForm action={createRoute} resetOnSuccess>
              {(state, busy) => (
                <div className="grid grid-cols-[1fr_4.5rem_auto] items-end gap-2">
                  <input type="hidden" name="eventId" value={eventId} />
                  <Field label="Other route" error={state.errors?.name}>
                    <Input name="name" placeholder="e.g. Fun run" />
                  </Field>
                  <Field label="Colour">
                    <Input name="color" type="color" defaultValue="#00512d" className="h-[2.75rem] p-1" />
                  </Field>
                  <Button type="submit" size="sm" disabled={busy}>
                    Add
                  </Button>
                </div>
              )}
            </AdminForm>
          </div>
        </Panel>

        {selected && (
          <Panel title={`Edit ${selected.name}`}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Next map click adds">
                  <Select value={kind} onChange={(e) => setKind(e.target.value as RoutePointKind)}>
                    {(Object.keys(KIND_LABELS) as RoutePointKind[]).map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABELS[k]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Label (optional)">
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Turn at 5 km" />
                </Field>
              </div>
              <p className="text-xs text-muted">Click the map to place it. Drag any pin on this route to fine-tune.</p>
              <div className="flex gap-2">
                <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="…or paste a Google Maps link" />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={pending || !link}
                  onClick={() =>
                    run(async () => {
                      await addRoutePointFromLink(selected.id, kind, label, link);
                      setLink("");
                      afterAdd();
                    })
                  }
                >
                  Add
                </Button>
              </div>
              {error && <Alert tone="red">{error}</Alert>}

              <ol className="divide-y divide-line rounded-[var(--radius-control)] border border-line">
                {selected.points.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-2 px-2 py-1.5 text-sm">
                    <span className="w-5 text-xs text-muted tabular-nums">{i + 1}</span>
                    <select
                      defaultValue={p.kind}
                      onChange={(e) => run(() => updateRoutePoint(p.id, e.target.value as RoutePointKind, p.label ?? ""))}
                      className="rounded border border-line bg-white px-1 py-0.5 text-xs"
                      aria-label="Point type"
                    >
                      {(Object.keys(KIND_LABELS) as RoutePointKind[]).map((k) => (
                        <option key={k} value={k}>
                          {KIND_LABELS[k]}
                        </option>
                      ))}
                    </select>
                    <input
                      defaultValue={p.label ?? ""}
                      placeholder="Label"
                      onBlur={(e) => e.target.value !== (p.label ?? "") && run(() => updateRoutePoint(p.id, p.kind, e.target.value))}
                      className="min-w-0 flex-1 rounded border border-transparent px-1 py-0.5 text-xs hover:border-line"
                    />
                    <button
                      type="button"
                      className="p-0.5 text-muted disabled:opacity-30"
                      disabled={i === 0}
                      onClick={() => run(() => reorderRoutePoint(p.id, -1))}
                      aria-label="Move up"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-0.5 text-muted disabled:opacity-30"
                      disabled={i === selected.points.length - 1}
                      onClick={() => run(() => reorderRoutePoint(p.id, 1))}
                      aria-label="Move down"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-0.5 text-muted hover:text-danger"
                      onClick={() => run(() => deleteRoutePoint(p.id))}
                      aria-label="Delete point"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
                {selected.points.length === 0 && <li className="px-3 py-3 text-sm text-muted">No points yet. Start by placing the start line.</li>}
              </ol>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => confirm(`Delete the ${selected.name} route and its points?`) && run(() => deleteRoute(selected.id))}
              >
                Delete this route
              </Button>
            </div>
          </Panel>
        )}
      </div>

      <div className="h-[70vh] min-h-[28rem] overflow-hidden rounded-[var(--radius-card)] border border-line xl:sticky xl:top-4">
        <MapView
          className="size-full"
          markers={markers}
          lines={lines}
          fitKey={`${selected?.id}:${routes.length}`}
          onMapClick={(p) => {
            if (!selected || pending) return;
            run(async () => {
              await addRoutePoint({
                routeId: selected.id,
                kind,
                label,
                lat: p.lat,
                lng: p.lng,
              });
              afterAdd();
            });
          }}
          onMarkerDrag={(id, p) => run(() => moveRoutePoint(id, p.lat, p.lng))}
        />
      </div>
    </div>
  );
}
