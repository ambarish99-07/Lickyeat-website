import type { StoreStatus, UpdateStoreSettingsRequest } from "@lickyeat/shared-types";
import {
  BrandStoreSettingsModel,
  StoreSettingsModel,
} from "../../db/models/StoreSettings.model.js";
import { serialize } from "../../lib/serialize.js";

function isWithin(dateStr: string, startDate: string, endDate: string): boolean {
  return dateStr >= startDate && dateStr <= endDate;
}

function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function withinServiceHours(
  hours: Array<{ weekday: number; open: string; close: string; closed: boolean }>,
  now: Date,
): boolean {
  if (hours.length === 0) return true;
  const today = hours.find((h) => h.weekday === now.getDay());
  if (!today) return true;
  if (today.closed) return false;
  const hhmm = now.toTimeString().slice(0, 5);
  return hhmm >= today.open && hhmm <= today.close;
}

export async function getOrCreateLickyeatSettings() {
  let doc = await StoreSettingsModel.findOne({ scope: "lickyeat" });
  if (!doc) doc = await StoreSettingsModel.create({ scope: "lickyeat" });
  return doc;
}

export async function getOrCreateBrandStoreSettings(brandId: string) {
  let doc = await BrandStoreSettingsModel.findOne({ brandId });
  if (!doc) doc = await BrandStoreSettingsModel.create({ brandId });
  return doc;
}

/** The one function combining Lickyeat-wide + per-brand — display and enforcement agree. */
export async function getBrandStoreStatus(brandId: string, now = new Date()): Promise<StoreStatus> {
  const today = todayIso(now);
  const parent = await getOrCreateLickyeatSettings();
  const brand = await getOrCreateBrandStoreSettings(brandId);

  const parentClosure = parent.plannedClosures.find((c) =>
    isWithin(today, c.startDate!, c.endDate!),
  );
  if (!parent.manualOpen)
    return { open: false, reason: "Lickyeat is currently not accepting orders.", upcomingClosure: null };
  if (parentClosure)
    return {
      open: false,
      reason: parentClosure.reason || "Closed for a planned break.",
      upcomingClosure: null,
    };
  if (!withinServiceHours(parent.serviceHours as never, now))
    return { open: false, reason: "Outside Lickyeat service hours.", upcomingClosure: null };

  const brandClosure = brand.plannedClosures.find((c) =>
    isWithin(today, c.startDate!, c.endDate!),
  );
  if (!brand.manualOpen)
    return { open: false, reason: "This brand is currently closed.", upcomingClosure: null };
  if (brandClosure)
    return {
      open: false,
      reason: brandClosure.reason || "This brand is on a planned break.",
      upcomingClosure: null,
    };
  if (!withinServiceHours(brand.serviceHours as never, now))
    return { open: false, reason: "Outside this brand's service hours.", upcomingClosure: null };

  const upcoming =
    [...parent.plannedClosures, ...brand.plannedClosures]
      .filter((c) => c.startDate! > today)
      .sort((a, b) => a.startDate!.localeCompare(b.startDate!))[0] ?? null;

  return {
    open: true,
    reason: "Open",
    upcomingClosure: upcoming ? (serialize(upcoming) as StoreStatus["upcomingClosure"]) : null,
  };
}

export async function updateLickyeatSettings(input: UpdateStoreSettingsRequest) {
  const doc = await getOrCreateLickyeatSettings();
  Object.assign(doc, input);
  await doc.save();
  return serialize(doc.toObject());
}

export async function updateBrandStoreSettings(
  brandId: string,
  input: UpdateStoreSettingsRequest,
) {
  const doc = await getOrCreateBrandStoreSettings(brandId);
  Object.assign(doc, input);
  await doc.save();
  return serialize(doc.toObject());
}
