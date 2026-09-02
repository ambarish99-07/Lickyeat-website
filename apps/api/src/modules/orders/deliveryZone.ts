import type { Address } from "@lickyeat/shared-types";

/**
 * Delivery-zone check. No real geocoding is configured (§5) — this is a
 * hardcoded single-city check for Patna. Swap for a real maps API later.
 */
const SERVED_CITY = "patna";
const SERVED_PINCODE_PREFIXES = ["8000", "8001", "8002", "8003", "8004", "8005", "8006", "8007"];

export function isWithinDeliveryZone(address: Address): boolean {
  const city = address.city.trim().toLowerCase();
  if (city !== SERVED_CITY) return false;
  return SERVED_PINCODE_PREFIXES.some((p) => address.pincode.startsWith(p));
}
