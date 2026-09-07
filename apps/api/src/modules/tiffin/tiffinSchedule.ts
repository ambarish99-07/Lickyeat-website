import type { TiffinDiet, TiffinMealType, TiffinPlanStyle, TiffinTier } from "@lickyeat/shared-types";
import { mealTypesForStyle } from "@lickyeat/shared-types";
import { resolveDish } from "./tiffinDishData.js";

/** Meals a style delivers each day. Re-exported for callers that used it before. */
export function mealsForStyle(
  style: TiffinPlanStyle,
  singleMeal: TiffinMealType = "lunch",
): TiffinMealType[] {
  return mealTypesForStyle(style, singleMeal);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekdayOf(dateStr: string): number {
  return new Date(dateStr + "T00:00:00Z").getUTCDay();
}

/** The dish for a given day, resolved against the subscription's own tier. */
function dishFor(
  tier: TiffinTier,
  diet: TiffinDiet,
  meal: TiffinMealType,
  dateStr: string,
): string {
  return resolveDish(tier, diet, meal, dateStr)?.dishName ?? "Home-style Thali";
}

export interface ScheduledMeal {
  date: string;
  meal: TiffinMealType;
  dishName: string;
  status: "scheduled" | "closed";
}

/**
 * Build the meal schedule for a plan, skipping already-declared closure dates so
 * a brand-new subscription never needs the retroactive fix. `deliveryDays` is the
 * plan length in delivery days (7 or 30); closures extend the calendar span.
 */
export function computeMealsForRangeSkippingClosedDates(opts: {
  startDate: string;
  deliveryDays: number;
  tier: TiffinTier;
  diet: TiffinDiet;
  style: TiffinPlanStyle;
  singleMeal?: TiffinMealType;
  closureRanges: Array<{ startDate: string; endDate: string }>;
}): { meals: ScheduledMeal[]; endDate: string } {
  const meals: ScheduledMeal[] = [];
  const styleMeals = mealsForStyle(opts.style, opts.singleMeal ?? "lunch");
  const isClosed = (date: string) =>
    opts.closureRanges.some((c) => date >= c.startDate && date <= c.endDate);

  let cursor = opts.startDate;
  let deliveredDays = 0;
  let guard = 0;
  while (deliveredDays < opts.deliveryDays && guard < 400) {
    guard++;
    const closed = isClosed(cursor);
    for (const meal of styleMeals) {
      meals.push({
        date: cursor,
        meal,
        dishName: dishFor(opts.tier, opts.diet, meal, cursor),
        status: closed ? "closed" : "scheduled",
      });
    }
    if (closed) {
      cursor = addDays(cursor, 1);
      continue;
    }
    deliveredDays++;
    if (deliveredDays < opts.deliveryDays) cursor = addDays(cursor, 1);
  }
  return { meals, endDate: cursor };
}

export { addDays, weekdayOf };
