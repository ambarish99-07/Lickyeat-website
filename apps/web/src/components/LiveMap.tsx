"use client";

import { useEffect, useRef } from "react";

/** Loaded once from CDN (jsDelivr) — no bundler dependency, no API key. */
const LEAFLET_JS = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";

let loader: Promise<void> | null = null;
function loadLeaflet(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  // @ts-expect-error runtime global
  if (window.L) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const s = document.createElement("script");
    s.src = LEAFLET_JS;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loader = null;
      reject(new Error("map failed to load"));
    };
    document.body.appendChild(s);
  });
  return loader;
}

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * A small OpenStreetMap view showing the rider (🛵) and the drop (🏠), with a
 * line between them. Re-centres and moves the rider marker on prop change
 * without a reload.
 */
export function LiveMap({
  rider,
  drop,
  className = "h-64 w-full",
}: {
  rider: LatLng | null;
  drop: LatLng | null;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const riderMarker = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dropMarker = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const line = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then(() => {
        if (cancelled || !el.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const L = (window as any).L;
        if (map.current) return;
        const center = rider ?? drop ?? { lat: 25.6183, lng: 85.1266 };
        map.current = L.map(el.current, { zoomControl: false, attributionControl: false }).setView(
          [center.lat, center.lng],
          14,
        );
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map.current);
        const icon = (emoji: string) =>
          L.divIcon({ html: `<div style="font-size:26px;line-height:26px">${emoji}</div>`, className: "", iconSize: [26, 26], iconAnchor: [13, 13] });
        if (drop) dropMarker.current = L.marker([drop.lat, drop.lng], { icon: icon("🏠") }).addTo(map.current);
        if (rider) riderMarker.current = L.marker([rider.lat, rider.lng], { icon: icon("🛵") }).addTo(map.current);
        redraw();
      })
      .catch(() => {
        /* map just won't show — the static address map + progress strip still do */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(redraw, [rider?.lat, rider?.lng, drop?.lat, drop?.lng]);

  function redraw() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    if (!L || !map.current) return;
    if (drop) {
      if (dropMarker.current) dropMarker.current.setLatLng([drop.lat, drop.lng]);
      else dropMarker.current = L.marker([drop.lat, drop.lng], { icon: L.divIcon({ html: '<div style="font-size:26px">🏠</div>', className: "", iconSize: [26, 26], iconAnchor: [13, 13] }) }).addTo(map.current);
    }
    if (rider) {
      if (riderMarker.current) riderMarker.current.setLatLng([rider.lat, rider.lng]);
      else riderMarker.current = L.marker([rider.lat, rider.lng], { icon: L.divIcon({ html: '<div style="font-size:26px">🛵</div>', className: "", iconSize: [26, 26], iconAnchor: [13, 13] }) }).addTo(map.current);
    }
    if (rider && drop) {
      const pts = [
        [rider.lat, rider.lng],
        [drop.lat, drop.lng],
      ];
      if (line.current) line.current.setLatLngs(pts);
      else line.current = L.polyline(pts, { color: "#0EA5E9", weight: 3, dashArray: "6 6" }).addTo(map.current);
      map.current.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
    } else if (rider) {
      map.current.setView([rider.lat, rider.lng], 15);
    } else if (drop) {
      map.current.setView([drop.lat, drop.lng], 15);
    }
  }

  return <div ref={el} className={className} />;
}
