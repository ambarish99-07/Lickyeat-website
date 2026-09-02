import type { TiffinDiet, TiffinMealType, TiffinTier } from "@lickyeat/shared-types";
import { TIFFIN_ADD_ON_PRICES, TIFFIN_MEAL_PRICES } from "@lickyeat/shared-types";

/**
 * GG Tiffin's real single-meal weekly rotation — one row per
 * (tier, diet, meal, weekday). day 0 = Sunday … 6 = Saturday, matching
 * getUTCDay(). Source: the business's curated menu (TBC-app TiffinDish seed).
 * `mini` deliberately has no breakfast (no rows) — Mini doesn't offer it.
 */
interface DishRow {
  tier: TiffinTier;
  diet: TiffinDiet;
  meal: TiffinMealType;
  day: number;
  dish: string;
  slug: string;
  addOns?: boolean;
  rice?: "pulao";
  extra?: string;
}

export const TIFFIN_DISH_ROWS: DishRow[] = [
  { tier:"regular", diet:"veg", meal:"breakfast", day:1, dish:"Masala Pasta", slug:"masala-pasta" },
  { tier:"regular", diet:"veg", meal:"breakfast", day:2, dish:"Sandwich", slug:"sandwich" },
  { tier:"regular", diet:"veg", meal:"breakfast", day:3, dish:"Upma", slug:"upma" },
  { tier:"regular", diet:"veg", meal:"breakfast", day:4, dish:"Aloo Paratha with Curd & Achar", slug:"aloo-paratha-with-dahi-and-achar" },
  { tier:"regular", diet:"veg", meal:"breakfast", day:5, dish:"Poha", slug:"poha" },
  { tier:"regular", diet:"veg", meal:"breakfast", day:6, dish:"Sattu Paratha with Curd & Achar", slug:"sattu-paratha-with-dahi-and-achar" },
  { tier:"regular", diet:"veg", meal:"breakfast", day:0, dish:"Puri with Chole & Achar", slug:"puri-chola" },
  { tier:"regular", diet:"veg", meal:"lunch", day:1, dish:"Aloo Matar", slug:"aloo-matar", addOns:true },
  { tier:"regular", diet:"veg", meal:"lunch", day:2, dish:"Aloo Parwal", slug:"aloo-parwal", addOns:true },
  { tier:"regular", diet:"veg", meal:"lunch", day:3, dish:"Aloo Soyabean", slug:"aloo-soyabean", addOns:true },
  { tier:"regular", diet:"veg", meal:"lunch", day:4, dish:"Mushroom Masala", slug:"mushroom-masala", addOns:true },
  { tier:"regular", diet:"veg", meal:"lunch", day:5, dish:"Rajma", slug:"rajma", addOns:true },
  { tier:"regular", diet:"veg", meal:"lunch", day:6, dish:"Aloo Gobhi", slug:"aloo-gobhi", addOns:true },
  { tier:"regular", diet:"veg", meal:"lunch", day:0, dish:"Lauki Masala", slug:"lauki-masala", addOns:true },
  { tier:"regular", diet:"veg", meal:"dinner", day:1, dish:"Aloo Gobhi", slug:"aloo-gobhi", addOns:true },
  { tier:"regular", diet:"veg", meal:"dinner", day:2, dish:"Lauki Masala", slug:"lauki-masala", addOns:true },
  { tier:"regular", diet:"veg", meal:"dinner", day:3, dish:"Matar Paneer", slug:"matar-paneer", addOns:true },
  { tier:"regular", diet:"veg", meal:"dinner", day:4, dish:"Dum Aloo", slug:"dum-aloo", addOns:true },
  { tier:"regular", diet:"veg", meal:"dinner", day:5, dish:"Matar Chole", slug:"matar-chole", addOns:true },
  { tier:"regular", diet:"veg", meal:"dinner", day:6, dish:"Matar Mushroom", slug:"matar-mushroom", addOns:true },
  { tier:"regular", diet:"veg", meal:"dinner", day:0, dish:"Dum Aloo", slug:"dum-aloo", addOns:true },
  { tier:"regular", diet:"non-veg", meal:"breakfast", day:1, dish:"Masala Pasta", slug:"masala-pasta" },
  { tier:"regular", diet:"non-veg", meal:"breakfast", day:2, dish:"Sandwich", slug:"sandwich" },
  { tier:"regular", diet:"non-veg", meal:"breakfast", day:3, dish:"Bread Omelette", slug:"bread-omelete" },
  { tier:"regular", diet:"non-veg", meal:"breakfast", day:4, dish:"Aloo Paratha with Curd & Achar", slug:"aloo-paratha-with-dahi-and-achar" },
  { tier:"regular", diet:"non-veg", meal:"breakfast", day:5, dish:"Poha", slug:"poha" },
  { tier:"regular", diet:"non-veg", meal:"breakfast", day:6, dish:"Sattu Paratha with Curd & Achar", slug:"sattu-paratha-with-dahi-and-achar" },
  { tier:"regular", diet:"non-veg", meal:"breakfast", day:0, dish:"Puri with Chole & Achar", slug:"puri-chola" },
  { tier:"regular", diet:"non-veg", meal:"lunch", day:1, dish:"Aloo Matar", slug:"aloo-matar", addOns:true },
  { tier:"regular", diet:"non-veg", meal:"lunch", day:2, dish:"Aloo Parwal", slug:"aloo-parwal", addOns:true },
  { tier:"regular", diet:"non-veg", meal:"lunch", day:3, dish:"Aloo Soyabean", slug:"aloo-soyabean", addOns:true },
  { tier:"regular", diet:"non-veg", meal:"lunch", day:4, dish:"Mushroom Masala", slug:"mushroom-masala", addOns:true },
  { tier:"regular", diet:"non-veg", meal:"lunch", day:5, dish:"Rajma", slug:"rajma", addOns:true },
  { tier:"regular", diet:"non-veg", meal:"lunch", day:6, dish:"Aloo Gobhi", slug:"aloo-gobhi", addOns:true },
  { tier:"regular", diet:"non-veg", meal:"lunch", day:0, dish:"Lauki Masala", slug:"lauki-masala", addOns:true },
  { tier:"regular", diet:"non-veg", meal:"dinner", day:1, dish:"Fish Curry", slug:"fish-curry", addOns:true, extra:"Fish piece" },
  { tier:"regular", diet:"non-veg", meal:"dinner", day:2, dish:"Lauki Masala", slug:"lauki-masala", addOns:true },
  { tier:"regular", diet:"non-veg", meal:"dinner", day:3, dish:"Egg Curry", slug:"egg-curry", addOns:true, extra:"Egg piece" },
  { tier:"regular", diet:"non-veg", meal:"dinner", day:4, dish:"Dum Aloo", slug:"dum-aloo", addOns:true },
  { tier:"regular", diet:"non-veg", meal:"dinner", day:5, dish:"Chicken Curry", slug:"chicken-curry", addOns:true, extra:"Chicken piece" },
  { tier:"regular", diet:"non-veg", meal:"dinner", day:6, dish:"Matar Mushroom", slug:"matar-mushroom", addOns:true },
  { tier:"regular", diet:"non-veg", meal:"dinner", day:0, dish:"Dum Aloo", slug:"dum-aloo", addOns:true },
  { tier:"mini", diet:"veg", meal:"lunch", day:1, dish:"Aloo Matar", slug:"aloo-matar-mini", addOns:true },
  { tier:"mini", diet:"veg", meal:"lunch", day:2, dish:"Aloo Parwal", slug:"aloo-parwal-mini", addOns:true },
  { tier:"mini", diet:"veg", meal:"lunch", day:3, dish:"Aloo Soyabean", slug:"aloo-soyabean-mini", addOns:true },
  { tier:"mini", diet:"veg", meal:"lunch", day:4, dish:"Mushroom Masala", slug:"mushroom-masala-mini", addOns:true },
  { tier:"mini", diet:"veg", meal:"lunch", day:5, dish:"Rajma", slug:"rajma-mini", addOns:true },
  { tier:"mini", diet:"veg", meal:"lunch", day:6, dish:"Aloo Gobhi", slug:"aloo-gobhi-mini", addOns:true },
  { tier:"mini", diet:"veg", meal:"lunch", day:0, dish:"Lauki Masala", slug:"lauki-masala-mini", addOns:true },
  { tier:"mini", diet:"veg", meal:"dinner", day:1, dish:"Aloo Gobhi", slug:"aloo-gobhi-mini", addOns:true },
  { tier:"mini", diet:"veg", meal:"dinner", day:2, dish:"Lauki Masala", slug:"lauki-masala-mini", addOns:true },
  { tier:"mini", diet:"veg", meal:"dinner", day:3, dish:"Matar Paneer", slug:"matar-paneer-mini", addOns:true },
  { tier:"mini", diet:"veg", meal:"dinner", day:4, dish:"Dum Aloo", slug:"dum-aloo-mini", addOns:true },
  { tier:"mini", diet:"veg", meal:"dinner", day:5, dish:"Matar Chole", slug:"matar-chole-mini", addOns:true },
  { tier:"mini", diet:"veg", meal:"dinner", day:6, dish:"Matar Mushroom", slug:"matar-mushroom", addOns:true },
  { tier:"mini", diet:"veg", meal:"dinner", day:0, dish:"Dum Aloo", slug:"dum-aloo-mini", addOns:true },
  { tier:"mini", diet:"non-veg", meal:"lunch", day:1, dish:"Aloo Matar", slug:"aloo-matar-mini", addOns:true },
  { tier:"mini", diet:"non-veg", meal:"lunch", day:2, dish:"Aloo Parwal", slug:"aloo-parwal-mini", addOns:true },
  { tier:"mini", diet:"non-veg", meal:"lunch", day:3, dish:"Aloo Soyabean", slug:"aloo-soyabean-mini", addOns:true },
  { tier:"mini", diet:"non-veg", meal:"lunch", day:4, dish:"Mushroom Masala", slug:"mushroom-masala-mini", addOns:true },
  { tier:"mini", diet:"non-veg", meal:"lunch", day:5, dish:"Rajma", slug:"rajma-mini", addOns:true },
  { tier:"mini", diet:"non-veg", meal:"lunch", day:6, dish:"Aloo Gobhi", slug:"aloo-gobhi-mini", addOns:true },
  { tier:"mini", diet:"non-veg", meal:"lunch", day:0, dish:"Lauki Masala", slug:"lauki-masala-mini", addOns:true },
  { tier:"mini", diet:"non-veg", meal:"dinner", day:1, dish:"Aloo Gobhi", slug:"aloo-gobhi-mini", addOns:true },
  { tier:"mini", diet:"non-veg", meal:"dinner", day:2, dish:"Lauki Masala", slug:"lauki-masala-mini", addOns:true },
  { tier:"mini", diet:"non-veg", meal:"dinner", day:3, dish:"Matar Paneer", slug:"matar-paneer-mini", addOns:true },
  { tier:"mini", diet:"non-veg", meal:"dinner", day:4, dish:"Dum Aloo", slug:"dum-aloo-mini", addOns:true },
  { tier:"mini", diet:"non-veg", meal:"dinner", day:5, dish:"Egg Curry", slug:"egg-curry-mini", addOns:true, extra:"Egg piece" },
  { tier:"mini", diet:"non-veg", meal:"dinner", day:6, dish:"Matar Mushroom", slug:"matar-mushroom", addOns:true },
  { tier:"mini", diet:"non-veg", meal:"dinner", day:0, dish:"Chicken Curry", slug:"chicken-curry-mini", addOns:true, extra:"Chicken piece" },
  { tier:"premium", diet:"veg", meal:"breakfast", day:1, dish:"Masala Pasta", slug:"masala-pasta" },
  { tier:"premium", diet:"veg", meal:"breakfast", day:2, dish:"Sandwich", slug:"sandwich" },
  { tier:"premium", diet:"veg", meal:"breakfast", day:3, dish:"Upma", slug:"upma" },
  { tier:"premium", diet:"veg", meal:"breakfast", day:4, dish:"Aloo Paratha with Curd & Achar", slug:"aloo-paratha-with-dahi-and-achar" },
  { tier:"premium", diet:"veg", meal:"breakfast", day:5, dish:"Poha", slug:"poha" },
  { tier:"premium", diet:"veg", meal:"breakfast", day:6, dish:"Sattu Paratha with Curd & Achar", slug:"sattu-paratha-with-dahi-and-achar" },
  { tier:"premium", diet:"veg", meal:"breakfast", day:0, dish:"Idli / Dosa with Sambar & Chutney", slug:"idli-with-sambar-and-chutney" },
  { tier:"premium", diet:"veg", meal:"lunch", day:1, dish:"Aloo Matar", slug:"aloo-matar", addOns:true },
  { tier:"premium", diet:"veg", meal:"lunch", day:2, dish:"Aloo Parwal", slug:"aloo-parwal", addOns:true },
  { tier:"premium", diet:"veg", meal:"lunch", day:3, dish:"Aloo Soyabean", slug:"aloo-soyabean", addOns:true },
  { tier:"premium", diet:"veg", meal:"lunch", day:4, dish:"Mushroom Masala", slug:"mushroom-masala", addOns:true },
  { tier:"premium", diet:"veg", meal:"lunch", day:5, dish:"Rajma", slug:"rajma", addOns:true },
  { tier:"premium", diet:"veg", meal:"lunch", day:6, dish:"Aloo Gobhi", slug:"aloo-gobhi", addOns:true },
  { tier:"premium", diet:"veg", meal:"lunch", day:0, dish:"Paneer Butter Masala", slug:"paneer-butter-masala-and-pulao", addOns:true, rice:"pulao" },
  { tier:"premium", diet:"veg", meal:"dinner", day:1, dish:"Aloo Gobhi", slug:"aloo-gobhi", addOns:true },
  { tier:"premium", diet:"veg", meal:"dinner", day:2, dish:"Lauki Masala", slug:"lauki-masala", addOns:true },
  { tier:"premium", diet:"veg", meal:"dinner", day:3, dish:"Matar Paneer", slug:"matar-paneer", addOns:true },
  { tier:"premium", diet:"veg", meal:"dinner", day:4, dish:"Dum Aloo", slug:"dum-aloo", addOns:true },
  { tier:"premium", diet:"veg", meal:"dinner", day:5, dish:"Matar Chole", slug:"matar-chole", addOns:true },
  { tier:"premium", diet:"veg", meal:"dinner", day:6, dish:"Matar Mushroom", slug:"matar-mushroom", addOns:true },
  { tier:"premium", diet:"veg", meal:"dinner", day:0, dish:"Puri with Chole", slug:"puri-chola" },
  { tier:"premium", diet:"non-veg", meal:"breakfast", day:1, dish:"Masala Pasta", slug:"masala-pasta" },
  { tier:"premium", diet:"non-veg", meal:"breakfast", day:2, dish:"Sandwich", slug:"sandwich" },
  { tier:"premium", diet:"non-veg", meal:"breakfast", day:3, dish:"Bread Omelette", slug:"bread-omelete" },
  { tier:"premium", diet:"non-veg", meal:"breakfast", day:4, dish:"Aloo Paratha with Curd & Achar", slug:"aloo-paratha-with-dahi-and-achar" },
  { tier:"premium", diet:"non-veg", meal:"breakfast", day:5, dish:"Poha", slug:"poha" },
  { tier:"premium", diet:"non-veg", meal:"breakfast", day:6, dish:"Sattu Paratha with Curd & Achar", slug:"sattu-paratha-with-dahi-and-achar" },
  { tier:"premium", diet:"non-veg", meal:"breakfast", day:0, dish:"Idli / Dosa with Sambar & Chutney", slug:"idli-with-sambar-and-chutney" },
  { tier:"premium", diet:"non-veg", meal:"lunch", day:1, dish:"Aloo Matar", slug:"aloo-matar", addOns:true },
  { tier:"premium", diet:"non-veg", meal:"lunch", day:2, dish:"Aloo Parwal", slug:"aloo-parwal", addOns:true },
  { tier:"premium", diet:"non-veg", meal:"lunch", day:3, dish:"Aloo Soyabean", slug:"aloo-soyabean", addOns:true },
  { tier:"premium", diet:"non-veg", meal:"lunch", day:4, dish:"Mushroom Masala", slug:"mushroom-masala", addOns:true },
  { tier:"premium", diet:"non-veg", meal:"lunch", day:5, dish:"Rajma", slug:"rajma", addOns:true },
  { tier:"premium", diet:"non-veg", meal:"lunch", day:6, dish:"Aloo Gobhi", slug:"aloo-gobhi", addOns:true },
  { tier:"premium", diet:"non-veg", meal:"lunch", day:0, dish:"Mutton Curry", slug:"mutton-and-pulao", addOns:true, rice:"pulao", extra:"Mutton piece" },
  { tier:"premium", diet:"non-veg", meal:"dinner", day:1, dish:"Fish Curry", slug:"fish-curry", addOns:true, extra:"Fish piece" },
  { tier:"premium", diet:"non-veg", meal:"dinner", day:2, dish:"Lauki Masala", slug:"lauki-masala", addOns:true },
  { tier:"premium", diet:"non-veg", meal:"dinner", day:3, dish:"Egg Curry", slug:"egg-curry", addOns:true, extra:"Egg piece" },
  { tier:"premium", diet:"non-veg", meal:"dinner", day:4, dish:"Dum Aloo", slug:"dum-aloo", addOns:true },
  { tier:"premium", diet:"non-veg", meal:"dinner", day:5, dish:"Chicken Curry", slug:"chicken-curry", addOns:true, extra:"Chicken piece" },
  { tier:"premium", diet:"non-veg", meal:"dinner", day:6, dish:"Matar Mushroom", slug:"matar-mushroom", addOns:true },
  { tier:"premium", diet:"non-veg", meal:"dinner", day:0, dish:"Puri with Chole", slug:"puri-chola" },
];

const byKey = new Map<string, DishRow>();
for (const r of TIFFIN_DISH_ROWS) byKey.set(`${r.tier}|${r.diet}|${r.meal}|${r.day}`, r);

export function weekdayOfDate(dateStr: string): number {
  return new Date(dateStr + "T00:00:00Z").getUTCDay();
}

export interface ResolvedDish {
  dishName: string;
  imageSlug: string;
  hasAddOns: boolean;
  rice: "rice" | "pulao";
  extraAddOnName?: string;
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
    hasAddOns: Boolean(row.addOns),
    rice: row.rice ?? "rice",
    extraAddOnName: row.extra,
  };
}

export function singleMealBasePrice(tier: TiffinTier, meal: TiffinMealType): number | null {
  return TIFFIN_MEAL_PRICES[tier][meal] ?? null;
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
