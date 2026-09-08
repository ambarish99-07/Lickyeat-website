import {
  DEFAULT_SHOP_LOCATION,
  estimateDriveSeconds,
  haversineMeters,
  type GeoPoint,
} from "@lickyeat/shared-types";
import { env } from "../config/env.js";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OSRM = "https://router.project-osrm.org/route/v1/driving";
// Nominatim's usage policy wants a real identifying UA and light traffic.
const UA = "LickyeatWeb/1.0 (+https://lickyeat.com)";
const TIMEOUT_MS = 6000;

export function shopLocation(): GeoPoint {
  const { lat, lng } = env.shop;
  return lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)
    ? { lat, lng }
    : DEFAULT_SHOP_LOCATION;
}

async function fetchJson(url: string): Promise<unknown> {
  // Tests never hit the network — every geocode/route falls back deterministically.
  if (env.isTest) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: ctrl.signal });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Best-effort geocode of a free-text address. null when it can't be resolved. */
export async function geocodeAddress(parts: {
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
}): Promise<GeoPoint | null> {
  const q = [parts.line1, parts.line2, parts.city, parts.pincode, "India"]
    .filter(Boolean)
    .join(", ");
  const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=in`;
  const data = (await fetchJson(url)) as Array<{ lat: string; lon: string }> | null;
  const hit = data?.[0];
  if (!hit) return null;
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  routed: boolean;
}

/** Road distance/time between two points. Falls back to straight-line + an
 *  average-speed estimate when OSRM is unreachable. */
export async function routeBetween(from: GeoPoint, to: GeoPoint): Promise<RouteResult> {
  const url = `${OSRM}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
  const data = (await fetchJson(url)) as
    | { routes?: Array<{ distance: number; duration: number }> }
    | null;
  const route = data?.routes?.[0];
  if (route && Number.isFinite(route.distance) && Number.isFinite(route.duration)) {
    return { distanceMeters: Math.round(route.distance), durationSeconds: Math.round(route.duration), routed: true };
  }
  const straight = haversineMeters(from, to);
  return {
    // road distance is typically ~1.3× straight-line in a city grid
    distanceMeters: Math.round(straight * 1.3),
    durationSeconds: estimateDriveSeconds(straight * 1.3),
    routed: false,
  };
}

/** Prep time added on top of drive time for the customer-facing ETA. */
export const PREP_MINUTES = env.shop.prepMinutes;
