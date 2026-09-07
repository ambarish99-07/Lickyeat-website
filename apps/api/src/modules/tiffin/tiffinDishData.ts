import type { TiffinDiet, TiffinMealType, TiffinTier } from "@lickyeat/shared-types";
import { TIFFIN_ADD_ON_PRICES, TIFFIN_MEAL_PRICES } from "@lickyeat/shared-types";

/**
 * GG Tiffin's real weekly rotation — one row per (tier, diet, meal, weekday).
 * day 0 = Sunday … 6 = Saturday, matching getUTCDay(). Source: the business's
 * curated menu, kept in sync with the mobile app's TiffinDish seed (see
 * docs/SYNC-FROM-APP.md). Both the single-meal purchase menu and subscription
 * meal scheduling resolve against these rows, keyed by the plan/order tier.
 * `mini` deliberately has no breakfast (no rows). `price` is the per-dish price;
 * it overrides the shared (tier, meal) TIFFIN_MEAL_PRICES slot price.
 */
interface DishRow {
  tier: TiffinTier;
  diet: TiffinDiet;
  meal: TiffinMealType;
  day: number;
  dish: string;
  slug: string;
  /** per-dish price — overrides the shared TIFFIN_MEAL_PRICES slot price. */
  price: number;
  addOns?: boolean;
  rice?: "pulao";
  extra?: string;
}

export const TIFFIN_DISH_ROWS: DishRow[] = [
  { tier:"regular", diet:"veg", meal:"breakfast", day:1, dish:"Masala Pasta", slug:"masala-pasta", price:49 },
  { tier:"regular", diet:"veg", meal:"breakfast", day:2, dish:"Poha", slug:"poha", price:59 },
  { tier:"regular", diet:"veg", meal:"breakfast", day:3, dish:"Upma", slug:"upma", price:69 },
  { tier:"regular", diet:"veg", meal:"breakfast", day:4, dish:"Aloo Paratha with Curd & Achar", slug:"aloo-paratha-with-dahi-and-achar", price:79 },
  { tier:"regular", diet:"veg", meal:"breakfast", day:5, dish:"Sandwich", slug:"sandwich", price:69 },
  { tier:"regular", diet:"veg", meal:"breakfast", day:6, dish:"Sattu Paratha with Curd & Achar", slug:"sattu-paratha-with-dahi-and-achar", price:79 },
  { tier:"regular", diet:"veg", meal:"breakfast", day:0, dish:"Puri with Chole & Achar", slug:"puri-chola", price:69 },
  { tier:"regular", diet:"veg", meal:"lunch", day:1, dish:"Aloo Matar", slug:"aloo-matar", price:79, addOns:true },
  { tier:"regular", diet:"veg", meal:"lunch", day:2, dish:"Aloo Parwal", slug:"aloo-parwal", price:89, addOns:true },
  { tier:"regular", diet:"veg", meal:"lunch", day:3, dish:"Aloo Soyabean", slug:"aloo-soyabean", price:79, addOns:true },
  { tier:"regular", diet:"veg", meal:"lunch", day:4, dish:"Mushroom Masala", slug:"mushroom-masala", price:99, addOns:true },
  { tier:"regular", diet:"veg", meal:"lunch", day:5, dish:"Rajma", slug:"rajma", price:89, addOns:true },
  { tier:"regular", diet:"veg", meal:"lunch", day:6, dish:"Aloo Gobhi", slug:"aloo-gobhi", price:99, addOns:true },
  { tier:"regular", diet:"veg", meal:"lunch", day:0, dish:"Lauki Masala", slug:"lauki-masala", price:79, addOns:true },
  { tier:"regular", diet:"veg", meal:"dinner", day:1, dish:"Aloo Gobhi", slug:"aloo-gobhi", price:99, addOns:true },
  { tier:"regular", diet:"veg", meal:"dinner", day:2, dish:"Lauki Masala", slug:"lauki-masala", price:79, addOns:true },
  { tier:"regular", diet:"veg", meal:"dinner", day:3, dish:"Matar Paneer", slug:"matar-paneer", price:109, addOns:true },
  { tier:"regular", diet:"veg", meal:"dinner", day:4, dish:"Dum Aloo", slug:"dum-aloo", price:89, addOns:true },
  { tier:"regular", diet:"veg", meal:"dinner", day:5, dish:"Matar Chole", slug:"matar-chole", price:79, addOns:true },
  { tier:"regular", diet:"veg", meal:"dinner", day:6, dish:"Matar Mushroom", slug:"matar-mushroom", price:99, addOns:true },
  { tier:"regular", diet:"veg", meal:"dinner", day:0, dish:"Veg Biryani", slug:"veg-biryani", price:79 },
  { tier:"regular", diet:"non-veg", meal:"breakfast", day:1, dish:"Masala Pasta", slug:"masala-pasta", price:49 },
  { tier:"regular", diet:"non-veg", meal:"breakfast", day:2, dish:"Poha", slug:"poha", price:59 },
  { tier:"regular", diet:"non-veg", meal:"breakfast", day:3, dish:"Bread Omelette", slug:"bread-omelete", price:49 },
  { tier:"regular", diet:"non-veg", meal:"breakfast", day:4, dish:"Aloo Paratha with Curd & Achar", slug:"aloo-paratha-with-dahi-and-achar", price:79 },
  { tier:"regular", diet:"non-veg", meal:"breakfast", day:5, dish:"Chicken Sandwich", slug:"sandwich", price:89 },
  { tier:"regular", diet:"non-veg", meal:"breakfast", day:6, dish:"Sattu Paratha with Curd & Achar", slug:"sattu-paratha-with-dahi-and-achar", price:79 },
  { tier:"regular", diet:"non-veg", meal:"breakfast", day:0, dish:"Puri with Chole & Achar", slug:"puri-chola", price:69 },
  { tier:"regular", diet:"non-veg", meal:"lunch", day:1, dish:"Aloo Matar", slug:"aloo-matar", price:79, addOns:true },
  { tier:"regular", diet:"non-veg", meal:"lunch", day:2, dish:"Aloo Parwal", slug:"aloo-parwal", price:89, addOns:true },
  { tier:"regular", diet:"non-veg", meal:"lunch", day:3, dish:"Aloo Soyabean", slug:"aloo-soyabean", price:79, addOns:true },
  { tier:"regular", diet:"non-veg", meal:"lunch", day:4, dish:"Mushroom Masala", slug:"mushroom-masala", price:99, addOns:true },
  { tier:"regular", diet:"non-veg", meal:"lunch", day:5, dish:"Rajma", slug:"rajma", price:89, addOns:true },
  { tier:"regular", diet:"non-veg", meal:"lunch", day:6, dish:"Aloo Gobhi", slug:"aloo-gobhi", price:99, addOns:true },
  { tier:"regular", diet:"non-veg", meal:"lunch", day:0, dish:"Lauki Masala", slug:"lauki-masala", price:79, addOns:true },
  { tier:"regular", diet:"non-veg", meal:"dinner", day:1, dish:"Fish Curry", slug:"fish-curry", price:89, addOns:true, extra:"Fish piece" },
  { tier:"regular", diet:"non-veg", meal:"dinner", day:2, dish:"Lauki Masala", slug:"lauki-masala", price:79, addOns:true },
  { tier:"regular", diet:"non-veg", meal:"dinner", day:3, dish:"Egg Curry", slug:"egg-curry", price:69, addOns:true, extra:"Egg piece" },
  { tier:"regular", diet:"non-veg", meal:"dinner", day:4, dish:"Dum Aloo", slug:"dum-aloo", price:89, addOns:true },
  { tier:"regular", diet:"non-veg", meal:"dinner", day:5, dish:"Chicken Curry", slug:"chicken-curry", price:89, addOns:true, extra:"Chicken piece" },
  { tier:"regular", diet:"non-veg", meal:"dinner", day:6, dish:"Matar Mushroom", slug:"matar-mushroom", price:99, addOns:true },
  { tier:"regular", diet:"non-veg", meal:"dinner", day:0, dish:"Chicken Biryani", slug:"chicken-biryani", price:99 },
  { tier:"mini", diet:"veg", meal:"lunch", day:1, dish:"Aloo Matar", slug:"aloo-matar-mini", price:79, addOns:true },
  { tier:"mini", diet:"veg", meal:"lunch", day:2, dish:"Aloo Parwal", slug:"aloo-parwal-mini", price:79, addOns:true },
  { tier:"mini", diet:"veg", meal:"lunch", day:3, dish:"Aloo Soyabean", slug:"aloo-soyabean-mini", price:69, addOns:true },
  { tier:"mini", diet:"veg", meal:"lunch", day:4, dish:"Mushroom Masala", slug:"mushroom-masala-mini", price:99, addOns:true },
  { tier:"mini", diet:"veg", meal:"lunch", day:5, dish:"Rajma", slug:"rajma-mini", price:79, addOns:true },
  { tier:"mini", diet:"veg", meal:"lunch", day:6, dish:"Aloo Gobhi", slug:"aloo-gobhi-mini", price:89, addOns:true },
  { tier:"mini", diet:"veg", meal:"lunch", day:0, dish:"Lauki Masala", slug:"lauki-masala-mini", price:69, addOns:true },
  { tier:"mini", diet:"veg", meal:"dinner", day:1, dish:"Aloo Gobhi", slug:"aloo-gobhi-mini", price:89, addOns:true },
  { tier:"mini", diet:"veg", meal:"dinner", day:2, dish:"Lauki Masala", slug:"lauki-masala-mini", price:69, addOns:true },
  { tier:"mini", diet:"veg", meal:"dinner", day:3, dish:"Matar Paneer", slug:"matar-paneer-mini", price:99, addOns:true },
  { tier:"mini", diet:"veg", meal:"dinner", day:4, dish:"Dum Aloo", slug:"dum-aloo-mini", price:89, addOns:true },
  { tier:"mini", diet:"veg", meal:"dinner", day:5, dish:"Matar Chole", slug:"matar-chole-mini", price:69, addOns:true },
  { tier:"mini", diet:"veg", meal:"dinner", day:6, dish:"Matar Mushroom", slug:"matar-mushroom", price:79, addOns:true },
  { tier:"mini", diet:"veg", meal:"dinner", day:0, dish:"Veg Biryani", slug:"veg-biryani", price:79 },
  { tier:"mini", diet:"non-veg", meal:"lunch", day:1, dish:"Aloo Matar", slug:"aloo-matar-mini", price:79, addOns:true },
  { tier:"mini", diet:"non-veg", meal:"lunch", day:2, dish:"Aloo Parwal", slug:"aloo-parwal-mini", price:79, addOns:true },
  { tier:"mini", diet:"non-veg", meal:"lunch", day:3, dish:"Aloo Soyabean", slug:"aloo-soyabean-mini", price:69, addOns:true },
  { tier:"mini", diet:"non-veg", meal:"lunch", day:4, dish:"Mushroom Masala", slug:"mushroom-masala-mini", price:99, addOns:true },
  { tier:"mini", diet:"non-veg", meal:"lunch", day:5, dish:"Rajma", slug:"rajma-mini", price:79, addOns:true },
  { tier:"mini", diet:"non-veg", meal:"lunch", day:6, dish:"Aloo Gobhi", slug:"aloo-gobhi-mini", price:89, addOns:true },
  { tier:"mini", diet:"non-veg", meal:"lunch", day:0, dish:"Lauki Masala", slug:"lauki-masala-mini", price:69, addOns:true },
  { tier:"mini", diet:"non-veg", meal:"dinner", day:1, dish:"Fish Curry", slug:"fish-curry-mini", price:89, addOns:true, extra:"Fish piece" },
  { tier:"mini", diet:"non-veg", meal:"dinner", day:2, dish:"Lauki Masala", slug:"lauki-masala-mini", price:69, addOns:true },
  { tier:"mini", diet:"non-veg", meal:"dinner", day:3, dish:"Egg Curry", slug:"egg-curry-mini", price:69, addOns:true, extra:"Egg piece" },
  { tier:"mini", diet:"non-veg", meal:"dinner", day:4, dish:"Dum Aloo", slug:"dum-aloo-mini", price:89, addOns:true },
  { tier:"mini", diet:"non-veg", meal:"dinner", day:5, dish:"Chicken Curry", slug:"chicken-curry-mini", price:89, addOns:true, extra:"Chicken piece" },
  { tier:"mini", diet:"non-veg", meal:"dinner", day:6, dish:"Matar Mushroom", slug:"matar-mushroom", price:79, addOns:true },
  { tier:"mini", diet:"non-veg", meal:"dinner", day:0, dish:"Chicken Biryani", slug:"chicken-biryani", price:99 },
  { tier:"premium", diet:"veg", meal:"breakfast", day:1, dish:"Masala Pasta", slug:"masala-pasta", price:49 },
  { tier:"premium", diet:"veg", meal:"breakfast", day:2, dish:"Poha", slug:"poha", price:59 },
  { tier:"premium", diet:"veg", meal:"breakfast", day:3, dish:"Upma", slug:"upma", price:69 },
  { tier:"premium", diet:"veg", meal:"breakfast", day:4, dish:"Aloo Paratha with Curd & Achar", slug:"aloo-paratha-with-dahi-and-achar", price:79 },
  { tier:"premium", diet:"veg", meal:"breakfast", day:5, dish:"Sandwich", slug:"sandwich", price:69 },
  { tier:"premium", diet:"veg", meal:"breakfast", day:6, dish:"Sattu Paratha with Curd & Achar", slug:"sattu-paratha-with-dahi-and-achar", price:79 },
  { tier:"premium", diet:"veg", meal:"breakfast", day:0, dish:"Idli / Dosa with Sambar & Chutney", slug:"idli-with-sambar-and-chutney", price:79 },
  { tier:"premium", diet:"veg", meal:"lunch", day:1, dish:"Aloo Matar", slug:"aloo-matar", price:79, addOns:true },
  { tier:"premium", diet:"veg", meal:"lunch", day:2, dish:"Aloo Parwal", slug:"aloo-parwal", price:89, addOns:true },
  { tier:"premium", diet:"veg", meal:"lunch", day:3, dish:"Aloo Soyabean", slug:"aloo-soyabean", price:79, addOns:true },
  { tier:"premium", diet:"veg", meal:"lunch", day:4, dish:"Mushroom Masala", slug:"mushroom-masala", price:99, addOns:true },
  { tier:"premium", diet:"veg", meal:"lunch", day:5, dish:"Rajma", slug:"rajma", price:89, addOns:true },
  { tier:"premium", diet:"veg", meal:"lunch", day:6, dish:"Aloo Gobhi", slug:"aloo-gobhi", price:99, addOns:true },
  { tier:"premium", diet:"veg", meal:"lunch", day:0, dish:"Paneer Butter Masala", slug:"paneer-butter-masala-and-pulao", price:119, addOns:true, rice:"pulao" },
  { tier:"premium", diet:"veg", meal:"dinner", day:1, dish:"Aloo Gobhi", slug:"aloo-gobhi", price:99, addOns:true },
  { tier:"premium", diet:"veg", meal:"dinner", day:2, dish:"Lauki Masala", slug:"lauki-masala", price:79, addOns:true },
  { tier:"premium", diet:"veg", meal:"dinner", day:3, dish:"Matar Paneer", slug:"matar-paneer", price:109, addOns:true },
  { tier:"premium", diet:"veg", meal:"dinner", day:4, dish:"Dum Aloo", slug:"dum-aloo", price:89, addOns:true },
  { tier:"premium", diet:"veg", meal:"dinner", day:5, dish:"Matar Chole", slug:"matar-chole", price:79, addOns:true },
  { tier:"premium", diet:"veg", meal:"dinner", day:6, dish:"Matar Mushroom", slug:"matar-mushroom", price:99, addOns:true },
  { tier:"premium", diet:"veg", meal:"dinner", day:0, dish:"Veg Biryani", slug:"veg-biryani", price:79 },
  { tier:"premium", diet:"non-veg", meal:"breakfast", day:1, dish:"Masala Pasta", slug:"masala-pasta", price:49 },
  { tier:"premium", diet:"non-veg", meal:"breakfast", day:2, dish:"Poha", slug:"poha", price:59 },
  { tier:"premium", diet:"non-veg", meal:"breakfast", day:3, dish:"Bread Omelette", slug:"bread-omelete", price:49 },
  { tier:"premium", diet:"non-veg", meal:"breakfast", day:4, dish:"Aloo Paratha with Curd & Achar", slug:"aloo-paratha-with-dahi-and-achar", price:79 },
  { tier:"premium", diet:"non-veg", meal:"breakfast", day:5, dish:"Chicken Sandwich", slug:"sandwich", price:89 },
  { tier:"premium", diet:"non-veg", meal:"breakfast", day:6, dish:"Sattu Paratha with Curd & Achar", slug:"sattu-paratha-with-dahi-and-achar", price:79 },
  { tier:"premium", diet:"non-veg", meal:"breakfast", day:0, dish:"Idli / Dosa with Sambar & Chutney", slug:"idli-with-sambar-and-chutney", price:79 },
  { tier:"premium", diet:"non-veg", meal:"lunch", day:1, dish:"Aloo Matar", slug:"aloo-matar", price:79, addOns:true },
  { tier:"premium", diet:"non-veg", meal:"lunch", day:2, dish:"Aloo Parwal", slug:"aloo-parwal", price:89, addOns:true },
  { tier:"premium", diet:"non-veg", meal:"lunch", day:3, dish:"Aloo Soyabean", slug:"aloo-soyabean", price:79, addOns:true },
  { tier:"premium", diet:"non-veg", meal:"lunch", day:4, dish:"Mushroom Masala", slug:"mushroom-masala", price:99, addOns:true },
  { tier:"premium", diet:"non-veg", meal:"lunch", day:5, dish:"Rajma", slug:"rajma", price:89, addOns:true },
  { tier:"premium", diet:"non-veg", meal:"lunch", day:6, dish:"Aloo Gobhi", slug:"aloo-gobhi", price:99, addOns:true },
  { tier:"premium", diet:"non-veg", meal:"lunch", day:0, dish:"Mutton Curry", slug:"mutton-and-pulao", price:149, addOns:true, rice:"pulao", extra:"Mutton piece" },
  { tier:"premium", diet:"non-veg", meal:"dinner", day:1, dish:"Fish Curry", slug:"fish-curry", price:89, addOns:true, extra:"Fish piece" },
  { tier:"premium", diet:"non-veg", meal:"dinner", day:2, dish:"Lauki Masala", slug:"lauki-masala", price:79, addOns:true },
  { tier:"premium", diet:"non-veg", meal:"dinner", day:3, dish:"Egg Curry", slug:"egg-curry", price:69, addOns:true, extra:"Egg piece" },
  { tier:"premium", diet:"non-veg", meal:"dinner", day:4, dish:"Dum Aloo", slug:"dum-aloo", price:89, addOns:true },
  { tier:"premium", diet:"non-veg", meal:"dinner", day:5, dish:"Chicken Curry", slug:"chicken-curry", price:89, addOns:true, extra:"Chicken piece" },
  { tier:"premium", diet:"non-veg", meal:"dinner", day:6, dish:"Matar Mushroom", slug:"matar-mushroom", price:99, addOns:true },
  { tier:"premium", diet:"non-veg", meal:"dinner", day:0, dish:"Chicken Biryani", slug:"chicken-biryani", price:99 },
];

const byKey = new Map<string, DishRow>();
for (const r of TIFFIN_DISH_ROWS) byKey.set(`${r.tier}|${r.diet}|${r.meal}|${r.day}`, r);

export function weekdayOfDate(dateStr: string): number {
  return new Date(dateStr + "T00:00:00Z").getUTCDay();
}

export interface ResolvedDish {
  dishName: string;
  imageSlug: string;
  /** effective price: per-dish override, else the tier/meal slot price. */
  price: number;
  hasAddOns: boolean;
  rice: "rice" | "pulao";
  extraAddOnName?: string;
}

function slotPrice(tier: TiffinTier, meal: TiffinMealType): number {
  return TIFFIN_MEAL_PRICES[tier][meal] ?? 0;
}

/** null for mini + breakfast (not offered). */
export function resolveDish(
  tier: TiffinTier,
  diet: TiffinDiet,
  meal: TiffinMealType,
  dateStr: string,
): ResolvedDish | null {
  const day = weekdayOfDate(dateStr);
  const row = byKey.get(`${tier}|${diet}|${meal}|${day}`);
  if (!row) return null;
  return {
    dishName: row.dish,
    imageSlug: row.slug,
    price: row.price ?? slotPrice(tier, meal),
    hasAddOns: Boolean(row.addOns),
    rice: row.rice ?? "rice",
    extraAddOnName: row.extra,
  };
}

/** Slot price only — callers that have a resolved dish should prefer dish.price. */
export function singleMealBasePrice(tier: TiffinTier, meal: TiffinMealType): number | null {
  return TIFFIN_MEAL_PRICES[tier][meal] ?? null;
}

/** Effective price for a (tier, diet, meal, date): per-dish override, else slot. */
export function tiffinDishPrice(
  tier: TiffinTier,
  diet: TiffinDiet,
  meal: TiffinMealType,
  dateStr: string,
): number | null {
  const dish = resolveDish(tier, diet, meal, dateStr);
  return dish ? dish.price : null;
}

export interface AddOnOption {
  name: string;
  price: number;
}

/**
 * The real, individually-priced extras for a resolved dish — never auto-included.
 * Regular/Mini: Rice, Roti, Daal + an "Extra {dish}" (or the dish's protein).
 * Premium: swaps Roti→Paratha, and Rice→Pulao on pulao dishes.
 * Breakfast and dishes without add-ons return [].
 */
export function resolveAddOns(
  tier: TiffinTier,
  meal: TiffinMealType,
  dish: ResolvedDish,
): AddOnOption[] {
  if (meal === "breakfast" || !dish.hasAddOns) return [];
  const priceOf = (n: string) => TIFFIN_ADD_ON_PRICES[n] ?? 0;

  const staples =
    tier === "premium"
      ? [dish.rice === "pulao" ? "Pulao" : "Rice", "Paratha", "Daal"]
      : ["Rice", "Roti", "Daal"];

  const last: AddOnOption = dish.extraAddOnName
    ? { name: dish.extraAddOnName, price: priceOf(dish.extraAddOnName) }
    : { name: `Extra ${dish.dishName}`, price: priceOf("Extra Portion") };

  return [...staples.map((n) => ({ name: n, price: priceOf(n) })), last];
}
