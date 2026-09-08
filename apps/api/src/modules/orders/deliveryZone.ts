import type { Address, GeoPoint } from "@lickyeat/shared-types";
import { DELIVERY_MAX_KM, haversineMeters } from "@lickyeat/shared-types";
import { geocodeAddress, routeBetween, shopLocation, PREP_MINUTES } from "../../lib/geo.js";

// Fallback when geocoding is unavailable — the old hardcoded Patna check.
const SERVED_CITY = "patna";
const SERVED_PINCODE_PREFIXES = ["8000", "8001", "8002", "8003", "8004", "8005", "8006", "8007"];

function passesCityCheck(address: Address): boolean {
  const city = address.city.trim().toLowerCase();
  if (city !== SERVED_CITY) return false;
  return SERVED_PINCODE_PREFIXES.some((p) => address.pincode.startsWith(p));
}

/** Kept for callers that only need a boolean and already have coords, or none. */
export function isWithinDeliveryZone(address: Address): boolean {
  if (address.lat != null && address.lng != null) {
    return (
      haversineMeters(shopLocation(), { lat: address.lat, lng: address.lng }) <=
      DELIVERY_MAX_KM * 1000
    );
  }
  return passesCityCheck(address);
}

export interface ResolvedDelivery {
  serviceable: boolean;
  point: GeoPoint | null;
  geo: { distanceMeters: number; durationSeconds: number; routed: boolean } | null;
  etaMinutes: number | null;
}

/**
 * Geocode the address, check it's inside the delivery radius, and compute the
 * shop→door distance + ETA. Degrades to the city/pincode check (no distance/ETA)
 * when geocoding is unreachable, so an order is never blocked by a flaky
 * third-party lookup.
 */
export async function resolveDelivery(address: Address): Promise<ResolvedDelivery> {
  const point =
    address.lat != null && address.lng != null
      ? { lat: address.lat, lng: address.lng }
      : await geocodeAddress(address);

  if (!point) {
    return {
      serviceable: passesCityCheck(address),
      point: null,
      geo: null,
      etaMinutes: null,
    };
  }

  const shop = shopLocation();
  const straightMeters = haversineMeters(shop, point);
  if (straightMeters > DELIVERY_MAX_KM * 1000) {
    return { serviceable: false, point, geo: null, etaMinutes: null };
  }

  const route = await routeBetween(shop, point);
  const etaMinutes = Math.round(route.durationSeconds / 60) + PREP_MINUTES;
  return { serviceable: true, point, geo: route, etaMinutes };
}
