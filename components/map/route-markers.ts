import type { RoutePointKind } from "@/lib/generated/prisma/enums";
import { googleMapsUrl } from "@/lib/geo";
import type { MapLine, MapMarker } from "@/components/map/map-view";

type Route = {
  id: string;
  name: string;
  color: string;
  points: { id: string; kind: RoutePointKind; label: string | null; lat: number; lng: number }[];
};

const KIND_TEXT: Record<RoutePointKind, string> = { START: "Start", TURN: "Turning point", WAYPOINT: "Route", FINISH: "Finish" };

/** Turns routes into map pins (start, turns, finish) and a line through the points in order. */
export function routeMarkers(routes: Route[], opts: { editableRouteId?: string } = {}) {
  const markers: MapMarker[] = [];
  const lines: MapLine[] = [];
  for (const r of routes) {
    lines.push({ id: r.id, color: r.color, points: r.points.map((p) => ({ lat: p.lat, lng: p.lng })) });
    let turn = 0;
    for (const p of r.points) {
      if (p.kind === "WAYPOINT" && r.id !== opts.editableRouteId) continue;
      if (p.kind === "TURN") turn++;
      markers.push({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        pin: p.kind === "START" ? "S" : p.kind === "FINISH" ? "F" : p.kind === "TURN" ? `T${turn}` : "",
        color: p.kind === "START" ? "#00512d" : p.kind === "FINISH" ? "#111111" : r.color,
        title: `${r.name}: ${p.label || KIND_TEXT[p.kind]}`,
        subtitle: KIND_TEXT[p.kind],
        link: { href: googleMapsUrl(p.lat, p.lng), label: "Open in Google Maps" },
        draggable: r.id === opts.editableRouteId,
      });
    }
  }
  return { markers, lines };
}
