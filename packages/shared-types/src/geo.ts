import type { GeoPoint } from "./auth.js";

/**
 * The kitchen's location. GG Tiffin + all Lickyeat brands cook out of one Patna
 * kitchen for now, so a single point is enough. Override with SHOP_LAT / SHOP_LNG
 * env vars on the API. Default: Boring Road, Patna.
 */
export const DEFAULT_SHOP_LOCATION: GeoPoint = { lat: 25.6183, lng: 85.1266 };

/** Outside this straight-line radius from the kitchen, we don't deliver. */
export const DELIVERY_MAX_KM = 8;

/** Straight-line distance between two points, in metres (haversine). */
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Rough drive time for a distance (metres) — ~18 km/h city average, min 6 min. */
export function estimateDriveSeconds(distanceMeters: number): number {
  return Math.max(360, Math.round((distanceMeters / 1000 / 18) * 3600));
}
