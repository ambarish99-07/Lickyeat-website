import type { TiffinDiet, TiffinMealType, TiffinPlanStyle } from "@lickyeat/shared-types";
import { getTiffinDishForDay } from "@lickyeat/shared-types";

export function mealsForStyle(
  style: TiffinPlanStyle,
  singleMeal: TiffinMealType = "lunch",
): TiffinMealType[] {
  if (style === "single") return [singleMeal];
  if (style === "twice-daily") return ["lunch", "dinner"];
  return ["breakfast", "lunch", "dinner"];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekdayOf(dateStr: string): number {
  return new Date(dateStr + "T00:00:00Z").getUTCDay();
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
    if (isClosed(cursor)) {
      for (const meal of styleMeals) {
        meals.push({ date: cursor, meal, dishName: getTiffinDishForDay(meal, opts.diet, weekdayOf(cursor)), status: "closed" });
      }
      cursor = addDays(cursor, 1);
      continue;
    }
    for (const meal of styleMeals) {
      meals.push({
        date: cursor,
        meal,
        dishName: getTiffinDishForDay(meal, opts.diet, weekdayOf(cursor)),
        status: "scheduled",
      });
    }
    deliveredDays++;
    if (deliveredDays < opts.deliveryDays) cursor = addDays(cursor, 1);
  }
  return { meals, endDate: cursor };
}

export { addDays, weekdayOf };
