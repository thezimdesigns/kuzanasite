"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { LatLng } from "@/lib/geo";
import { BULAWAYO } from "@/lib/geo";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  /** Short text inside the pin (e.g. "S", "10K", "F") or empty for a dot. */
  pin?: string;
  color?: string;
  title: string;
  subtitle?: string;
  link?: { href: string; label: string };
  draggable?: boolean;
};

export type MapLine = { id: string; color: string; points: LatLng[]; dashed?: boolean };

/**
 * Leaflet map with branded pins (OpenStreetMap tiles, no API key).
 * Popup text is set as text nodes, never HTML, so admin-entered labels are safe.
 */
export function MapView({
  markers,
  lines = [],
  className,
  onMapClick,
  onMarkerDrag,
  fitKey,
}: {
  markers: MapMarker[];
  lines?: MapLine[];
  className?: string;
  onMapClick?: (p: LatLng) => void;
  onMarkerDrag?: (id: string, p: LatLng) => void;
  /** Change this to refit the view to the markers. */
  fitKey?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const handlers = useRef({ onMapClick, onMarkerDrag });
  handlers.current = { onMapClick, onMarkerDrag };
  const fitted = useRef<string | undefined>(undefined);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(el.current, { scrollWheelZoom: false, zoomControl: true }).setView([BULAWAYO.lat, BULAWAYO.lng], 13);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      map.on("click", (e) => handlers.current.onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
      // Enable wheel zoom only after the map is focused, so the page still scrolls.
      map.on("focus", () => map.scrollWheelZoom.enable());
      map.on("blur", () => map.scrollWheelZoom.disable());
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 0);
      draw();
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const L = LRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();

    for (const line of lines) {
      if (line.points.length < 2) continue;
      L.polyline(
        line.points.map((p) => [p.lat, p.lng] as [number, number]),
        { color: line.color, weight: 5, opacity: 0.85, dashArray: line.dashed ? "8 8" : undefined, lineJoin: "round" },
      ).addTo(layer);
    }

    for (const m of markers) {
      const pin = document.createElement("span");
      pin.className = "kuzana-pin";
      pin.style.setProperty("--pin", m.color ?? "#00512d");
      const label = document.createElement("span");
      label.textContent = m.pin ?? "";
      pin.appendChild(label);
      const icon = L.divIcon({ html: pin.outerHTML, className: "", iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -30] });
      const marker = L.marker([m.lat, m.lng], { icon, draggable: !!m.draggable, title: m.title, alt: m.title, keyboard: true });

      const popup = document.createElement("div");
      popup.className = "kuzana-popup";
      const t = document.createElement("strong");
      t.textContent = m.title;
      popup.appendChild(t);
      if (m.subtitle) {
        const s = document.createElement("span");
        s.textContent = m.subtitle;
        popup.appendChild(s);
      }
      if (m.link) {
        const a = document.createElement("a");
        a.href = m.link.href;
        a.textContent = m.link.label;
        if (/^https?:/.test(m.link.href)) {
          a.target = "_blank";
          a.rel = "noopener";
        }
        popup.appendChild(a);
      }
      marker.bindPopup(popup);
      if (m.draggable) {
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          handlers.current.onMarkerDrag?.(m.id, { lat: p.lat, lng: p.lng });
        });
      }
      marker.addTo(layer);
    }

    const key = fitKey ?? "initial";
    if (fitted.current !== key) {
      const pts = [...markers.map((m) => [m.lat, m.lng] as [number, number]), ...lines.flatMap((l) => l.points.map((p) => [p.lat, p.lng] as [number, number]))];
      if (pts.length === 1) map.setView(pts[0], 15);
      else if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 16 });
      fitted.current = key;
    }
  }

  // Redraw when data changes.
  useEffect(draw);

  return <div ref={el} className={className} role="application" aria-label="Map" />;
}
