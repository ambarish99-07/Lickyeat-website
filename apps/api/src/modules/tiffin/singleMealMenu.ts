import type { TiffinDiet, TiffinMealType, TiffinTier } from "@lickyeat/shared-types";
import { getTiffinDishForDay, MEAL_ORDERING_CUTOFF_HOUR_IST } from "@lickyeat/shared-types";
import { weekdayOf } from "./tiffinSchedule.js";

const TIER_BASE_PRICE: Record<TiffinTier, Record<TiffinMealType, number>> = {
  mini: { breakfast: 45, lunch: 70, dinner: 70 },
  regular: { breakfast: 60, lunch: 95, dinner: 95 },
  premium: { breakfast: 90, lunch: 140, dinner: 140 },
};

/** Regular tier mirrors the subscription menu exactly. */
export function getSingleMealDish(
  meal: TiffinMealType,
  diet: TiffinDiet,
  tier: TiffinTier,
  dateStr: string,
): string {
  const weekday = weekdayOf(dateStr);
  const base = getTiffinDishForDay(meal, diet, weekday);
  if (tier === "mini") return meal === "breakfast" ? base : `${base} (Mini)`;
  if (tier === "premium") return `${base} Special`;
  return base;
}

export function getSingleMealBasePrice(meal: TiffinMealType, tier: TiffinTier): number {
  return TIER_BASE_PRICE[tier][meal];
}

export interface AddOnOption {
  name: string;
  price: number;
}

/** Individually-priced add-ons, re-derived server-side (never trust client prices). */
export function resolveAddOns(tier: TiffinTier, meal: TiffinMealType, diet: TiffinDiet): AddOnOption[] {
  const common: AddOnOption[] = [
    { name: "Extra Rice", price: 20 },
    { name: "Extra Roti (2)", price: 16 },
    { name: "Extra Daal", price: 25 },
  ];
  if (tier === "premium") {
    common.push({ name: "Paratha (2)", price: 30 }, { name: "Pulao", price: 40 });
  }
  if (diet === "non-veg") {
    common.push({ name: "Extra Protein Piece", price: 45 });
  }
  if (meal === "breakfast") {
    return [
      { name: "Extra Portion", price: 25 },
      { name: "Boiled Eggs (2)", price: 20 },
    ];
  }
  return common;
}

export function priceAddOns(
  tier: TiffinTier,
  meal: TiffinMealType,
  diet: TiffinDiet,
  chosen: string[],
): AddOnOption[] {
  const catalog = new Map(resolveAddOns(tier, meal, diet).map((a) => [a.name, a]));
  return chosen.map((name) => {
    const found = catalog.get(name);
    if (!found) throw new Error(`Unknown add-on "${name}".`);
    return found;
  });
}

/** IST-aware: can today's meal still be ordered? */
export function isMealOrderableForDate(
  meal: TiffinMealType,
  dateStr: string,
  now = new Date(),
): boolean {
  const istNow = new Date(now.getTime() + 5.5 * 3600 * 1000);
  const todayIst = istNow.toISOString().slice(0, 10);
  if (dateStr > todayIst) return true;
  if (dateStr < todayIst) return false;
  return istNow.getUTCHours() < MEAL_ORDERING_CUTOFF_HOUR_IST[meal];
}
