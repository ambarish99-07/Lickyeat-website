import type { TiffinDiet, TiffinMealType, TiffinTier } from "@lickyeat/shared-types";
import { MEAL_ORDERING_CUTOFF_HOUR_IST } from "@lickyeat/shared-types";
import {
  resolveAddOns as resolveDishAddOns,
  resolveDish,
  singleMealBasePrice,
  type AddOnOption,
} from "./tiffinDishData.js";

export type { AddOnOption } from "./tiffinDishData.js";

export function getSingleMealDish(
  meal: TiffinMealType,
  diet: TiffinDiet,
  tier: TiffinTier,
  dateStr: string,
): { name: string; imageSlug: string } | null {
  const dish = resolveDish(tier, diet, meal, dateStr);
  if (!dish) return null;
  return { name: dish.dishName, imageSlug: dish.imageSlug };
}

export function getSingleMealBasePrice(tier: TiffinTier, meal: TiffinMealType): number | null {
  return singleMealBasePrice(tier, meal);
}

export function resolveAddOns(
  tier: TiffinTier,
  meal: TiffinMealType,
  diet: TiffinDiet,
  dateStr: string,
): AddOnOption[] {
  const dish = resolveDish(tier, diet, meal, dateStr);
  if (!dish) return [];
  return resolveDishAddOns(tier, meal, dish);
}

export function priceAddOns(
  tier: TiffinTier,
  meal: TiffinMealType,
  diet: TiffinDiet,
  dateStr: string,
  chosen: string[],
): AddOnOption[] {
  const catalog = new Map(resolveAddOns(tier, meal, diet, dateStr).map((a) => [a.name, a]));
  return chosen.map((name) => {
    const found = catalog.get(name);
    if (!found) throw new Error(`Unknown add-on "${name}".`);
    return found;
  });
}

/** IST-aware: can this meal still be ordered for that date? */
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
