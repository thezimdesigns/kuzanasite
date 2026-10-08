"use client";

import { useState } from "react";
import type { EditorRoute } from "@/components/admin/route-editor";
import { MapView } from "@/components/map/map-view";
import { routeMarkers } from "@/components/map/route-markers";
import { cn } from "@/components/ui";

/** Public course map with a distance switcher (all distances, or one at a time). */
export function RouteMap({ routes }: { routes: EditorRoute[] }) {
  const [shown, setShown] = useState<string>("all");
  const visible = shown === "all" ? routes : routes.filter((r) => r.id === shown);
  const { markers, lines } = routeMarkers(visible);

  return (
    <div>
      <div role="group" aria-label="Distance" className="rail -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {[{ id: "all", name: "All distances", color: "" }, ...routes].map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setShown(r.id)}
            aria-pressed={shown === r.id}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-control)] border px-3.5 py-2 font-heading text-sm font-semibold transition-colors",
              shown === r.id ? "border-green-900 bg-green-900 text-white" : "border-line bg-white hover:border-green-800/60",
            )}
          >
            {r.color && <span className="size-2.5 rounded-full" style={{ background: r.color }} aria-hidden />}
            {r.name}
          </button>
        ))}
      </div>
      <div className="h-[65vh] min-h-[24rem] overflow-hidden rounded-[var(--radius-card)] border border-line">
        <MapView className="size-full" markers={markers} lines={lines} fitKey={shown} />
      </div>
      <p className="mt-2 text-xs text-muted">S start, T turning point, F finish. Tap a pin to open it in Google Maps.</p>
    </div>
  );
}
