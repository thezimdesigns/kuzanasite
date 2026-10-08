"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

export type PlanStall = {
  id: string;
  label: string;
  /** Position as a fraction (0-1) of the plan's width and height. */
  x: number;
  y: number;
  title?: string;
  subtitle?: string;
  link?: { href: string; label: string };
  /** Stall without an exhibitor: drawn as an outline. */
  empty?: boolean;
};

/**
 * Pan-and-zoom view of a floor plan image (Leaflet in flat CRS.Simple mode,
 * no map tiles). Stalls sit on top as labelled markers. Labels and popups
 * are set as text nodes, never HTML.
 */
export function FloorPlanView({
  imageUrl,
  width,
  height,
  stalls,
  highlight,
  focusId,
  onPlanClick,
  onStallDrag,
  onStallClick,
  className,
}: {
  imageUrl: string;
  width: number;
  height: number;
  stalls: PlanStall[];
  /** Stall ids to highlight (e.g. search matches). */
  highlight?: Set<string>;
  /** Zoom to this stall and open its popup. */
  focusId?: string | null;
  onPlanClick?: (p: { x: number; y: number }) => void;
  onStallDrag?: (id: string, p: { x: number; y: number }) => void;
  onStallClick?: (id: string) => void;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const markersRef = useRef(new Map<string, import("leaflet").Marker>());
  const handlers = useRef({ onPlanClick, onStallDrag, onStallClick });
  handlers.current = { onPlanClick, onStallDrag, onStallClick };
  const focused = useRef<string | null | undefined>(undefined);

  // Plan coordinates: y grows downwards from 0 to -height, x from 0 to width.
  const toLatLng = (x: number, y: number): [number, number] => [-y * height, x * width];
  const toFraction = (lat: number, lng: number) => ({
    x: Math.min(1, Math.max(0, lng / width)),
    y: Math.min(1, Math.max(0, -lat / height)),
  });

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current || mapRef.current) return;
      LRef.current = L;
      const bounds = L.latLngBounds([-height, 0], [0, width]);
      const map = L.map(el.current, {
        crs: L.CRS.Simple,
        minZoom: -6,
        maxZoom: 2,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        scrollWheelZoom: false,
        attributionControl: false,
        maxBounds: bounds.pad(0.25),
      });
      L.imageOverlay(imageUrl, bounds).addTo(map);
      map.fitBounds(bounds);
      map.setMinZoom(map.getZoom() - 1);
      map.on("click", (e) => handlers.current.onPlanClick?.(toFraction(e.latlng.lat, e.latlng.lng)));
      map.on("focus", () => map.scrollWheelZoom.enable());
      map.on("blur", () => map.scrollWheelZoom.disable());
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      el.current.classList.add("floor-plan");
      draw();
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // The plan image and size are fixed for the life of the view (keyed by the parent).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const L = LRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();
    markersRef.current.clear();
    const draggable = !!handlers.current.onStallDrag;

    for (const s of stalls) {
      const tag = document.createElement("span");
      tag.className = "kuzana-stall";
      tag.textContent = s.label;
      if (s.empty) tag.setAttribute("data-empty", "");
      if (highlight?.has(s.id)) tag.setAttribute("data-hit", "");
      const icon = L.divIcon({
        html: tag.outerHTML,
        className: "",
        iconSize: [0, 0],
        popupAnchor: [0, -12],
      });
      const marker = L.marker(toLatLng(s.x, s.y), {
        icon,
        draggable,
        keyboard: true,
        title: s.title ? `${s.label}: ${s.title}` : `Stand ${s.label}`,
        zIndexOffset: highlight?.has(s.id) ? 1000 : 0,
      });

      if (s.title || s.link) {
        const popup = document.createElement("div");
        popup.className = "kuzana-popup";
        const t = document.createElement("strong");
        t.textContent = s.title ?? `Stand ${s.label}`;
        popup.appendChild(t);
        const sub = document.createElement("span");
        sub.textContent = [`Stand ${s.label}`, s.subtitle].filter(Boolean).join(" · ");
        popup.appendChild(sub);
        if (s.link) {
          const a = document.createElement("a");
          a.href = s.link.href;
          a.textContent = s.link.label;
          popup.appendChild(a);
        }
        marker.bindPopup(popup);
      }
      marker.on("click", () => handlers.current.onStallClick?.(s.id));
      if (draggable) {
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          handlers.current.onStallDrag?.(s.id, toFraction(p.lat, p.lng));
        });
      }
      marker.addTo(layer);
      markersRef.current.set(s.id, marker);
    }

    if (focusId !== focused.current) {
      focused.current = focusId;
      const m = focusId ? markersRef.current.get(focusId) : null;
      if (m) {
        map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 0), { duration: 0.6 });
        m.openPopup();
      }
    }
  }

  useEffect(draw);

  return <div ref={el} className={className} role="application" aria-label="Floor plan. Drag to move, use the + and − buttons to zoom." />;
}
