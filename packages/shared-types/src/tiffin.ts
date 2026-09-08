import { z } from "zod";
import { ObjectIdSchema, RupeesSchema } from "./common.js";
import { AddressSchema } from "./auth.js";
import { PaymentMethodSchema, PaymentStatusSchema, RazorpayRefsSchema } from "./order.js";
import { RazorpayOrderInfoSchema } from "./payment.js";

/** GG Tiffin is a structurally separate order universe — it never touches Order. */
export const GG_TIFFIN_BRAND_ID = "gg-tiffin" as const;

export const TiffinDietSchema = z.enum(["veg", "non-veg"]);
export type TiffinDiet = z.infer<typeof TiffinDietSchema>;

/** Meal tiers — shared by single-meal ordering AND (as of the Mini/Premium plan
 * addition) the subscription catalog. Mini has no breakfast dish anywhere. */
export const TiffinTierSchema = z.enum(["regular", "mini", "premium"]);
export type TiffinTier = z.infer<typeof TiffinTierSchema>;
export const TIFFIN_TIER_LABELS: Record<TiffinTier, string> = {
  regular: "Regular",
  mini: "Mini",
  premium: "Premium",
};

export const TiffinMealTypeSchema = z.enum(["breakfast", "lunch", "dinner"]);
export type TiffinMealType = z.infer<typeof TiffinMealTypeSchema>;

/**
 * "single" = one meal a day (customer picks breakfast/lunch/dinner at subscribe
 * time). "twice-daily" = lunch + dinner. "thrice-daily" = all three.
 * "lunch-only" / "dinner-only" = one fixed meal, sold as its own plan (no choice).
 */
export const TiffinPlanStyleSchema = z.enum([
  "single",
  "twice-daily",
  "thrice-daily",
  "lunch-only",
  "dinner-only",
]);
export type TiffinPlanStyle = z.infer<typeof TiffinPlanStyleSchema>;

/** The meal types a given style delivers each day (for a fixed style; "single"
 * defers to the customer's pick). */
export function mealTypesForStyle(
  style: TiffinPlanStyle,
  singleMeal: TiffinMealType = "lunch",
): TiffinMealType[] {
  switch (style) {
    case "single":
      return [singleMeal];
    case "twice-daily":
      return ["lunch", "dinner"];
    case "thrice-daily":
      return ["breakfast", "lunch", "dinner"];
    case "lunch-only":
      return ["lunch"];
    case "dinner-only":
      return ["dinner"];
  }
}

/** Meal types a tier can serve (Mini has no breakfast). */
export function tierMealTypes(tier: TiffinTier): TiffinMealType[] {
  return tier === "mini" ? ["lunch", "dinner"] : ["breakfast", "lunch", "dinner"];
}

/** Is this (tier, style, chosen meal) combination coherent? */
export function isValidTierStyle(
  tier: TiffinTier,
  style: TiffinPlanStyle,
  singleMeal?: TiffinMealType,
): boolean {
  const allowed = new Set(tierMealTypes(tier));
  return mealTypesForStyle(style, singleMeal ?? "lunch").every((m) => allowed.has(m));
}

export const TiffinPlanDurationSchema = z.enum(["weekly", "monthly"]);
export type TiffinPlanDuration = z.infer<typeof TiffinPlanDurationSchema>;

export const TIFFIN_PLAN_DAYS = { weekly: 7, monthly: 30 } as const;

// Cancellation / refund policy (subscriptions)
export const CANCELLATION_FULL_REFUND_WINDOW_DAYS = 15;
export const CANCELLATION_REFUND_PERCENT = 50; // % refunded inside the window
export const WEEKLY_PLAN_CANCELLABLE = false;

// Single-meal order cancellation
export const SINGLE_MEAL_CANCELLATION_WINDOW_MINUTES = 15;
export const MAX_SINGLE_MEAL_QUANTITY = 10;

/**
 * Meal ordering cutoffs (IST) — today's meal is orderable only before this hour;
 * past it the order rolls to the same meal tomorrow. Matches the mobile app's
 * `mealOrderingWindow.ts`: each same-day window closes an hour before it ends
 * (lunch 2pm → 1pm cutoff, dinner 10pm → 9pm cutoff). Breakfast is always cooked
 * the night before, so it's never orderable same-day (cutoff 0).
 */
export const MEAL_ORDERING_CUTOFF_HOUR_IST: Record<TiffinMealType, number> = {
  breakfast: 0,
  lunch: 13,
  dinner: 21,
};

// ---------------------------------------------------------------------------
// GG Tiffin's real weekly rotation (Regular tier). Index 0 = Sunday … 6 = Sat,
// matching JS getUTCDay(). Non-veg differs from veg only on the days listed.
// Source: the business's curated menu (see the TBC-app TiffinDish seed).
// ---------------------------------------------------------------------------

export type WeeklyDishTable = readonly [string, string, string, string, string, string, string];

export const TIFFIN_WEEKLY_VEG: Record<TiffinMealType, WeeklyDishTable> = {
  // Sun, Mon, Tue, Wed, Thu, Fri, Sat — kept in sync with the app's Regular tier.
  breakfast: [
    "Puri with Chole & Achar",
    "Masala Pasta",
    "Poha",
    "Upma",
    "Aloo Paratha with Curd & Achar",
    "Sandwich",
    "Sattu Paratha with Curd & Achar",
  ],
  lunch: [
    "Lauki Masala",
    "Aloo Matar",
    "Aloo Parwal",
    "Aloo Soyabean",
    "Mushroom Masala",
    "Rajma",
    "Aloo Gobhi",
  ],
  dinner: [
    "Veg Biryani",
    "Aloo Gobhi",
    "Lauki Masala",
    "Matar Paneer",
    "Dum Aloo",
    "Matar Chole",
    "Matar Mushroom",
  ],
};

/** Non-veg swaps, keyed by weekday index (0 = Sunday). */
export const TIFFIN_WEEKLY_NONVEG_OVERRIDES: Partial<
  Record<TiffinMealType, Partial<Record<number, string>>>
> = {
  breakfast: { 3: "Bread Omelette", 5: "Chicken Sandwich" }, // Wed / Fri
  dinner: { 0: "Chicken Biryani", 1: "Fish Curry", 3: "Egg Curry", 5: "Chicken Curry" }, // Sun / Mon / Wed / Fri
};

/**
 * Dishes that are actually non-veg. The tiffin "diet" is the *rotation* a
 * customer subscribes to — the non-veg rotation still serves veg dishes on
 * most days (Aloo Matar lunch, etc.) and swaps in meat/egg/fish on a few. This
 * classifies the dish itself, for the per-dish veg/non-veg mark on the menu.
 */
const NON_VEG_TIFFIN_DISHES = new Set([
  "Fish Curry",
  "Egg Curry",
  "Chicken Curry",
  "Chicken Biryani",
  "Bread Omelette",
  "Chicken Sandwich",
  "Mutton Curry",
]);

export function isTiffinDishNonVeg(dishName: string): boolean {
  return NON_VEG_TIFFIN_DISHES.has(dishName.trim());
}

export function getTiffinDishForDay(
  meal: TiffinMealType,
  diet: TiffinDiet,
  weekday: number,
): string {
  const wd = ((weekday % 7) + 7) % 7;
  if (diet === "non-veg") {
    const override = TIFFIN_WEEKLY_NONVEG_OVERRIDES[meal]?.[wd];
    if (override) return override;
  }
  return TIFFIN_WEEKLY_VEG[meal][wd as 0] ?? "Home-style Thali";
}

/** Real single-meal prices, per (tier, meal). Mini has no breakfast. */
export const TIFFIN_MEAL_PRICES: Record<TiffinTier, Partial<Record<TiffinMealType, number>>> = {
  regular: { breakfast: 79, lunch: 129, dinner: 129 },
  mini: { lunch: 99, dinner: 99 },
  premium: { breakfast: 99, lunch: 169, dinner: 169 },
};

/** Shared flat add-on prices (single-meal). */
export const TIFFIN_ADD_ON_PRICES: Record<string, number> = {
  Rice: 20,
  Roti: 10,
  Daal: 20,
  Paratha: 15,
  Pulao: 25,
  "Fish piece": 45,
  "Egg piece": 15,
  "Chicken piece": 40,
  "Mutton piece": 60,
  "Extra Portion": 30,
};

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export const TiffinPlanSchema = z.object({
  id: ObjectIdSchema,
  name: z.string(),
  diet: TiffinDietSchema,
  /** Which single-meal tier this plan cooks to — "regular" for plans created
   * before tiers existed. */
  tier: TiffinTierSchema.default("regular"),
  style: TiffinPlanStyleSchema,
  duration: TiffinPlanDurationSchema,
  durationDays: z.number().int().positive(),
  /** Flat price for the whole plan (strikethrough value when salePercent set). */
  price: RupeesSchema,
  salePercent: z.number().min(1).max(99).nullable().default(null),
  imageUrl: z.string().nullable().default(null),
  active: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TiffinPlan = z.infer<typeof TiffinPlanSchema>;

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export const TiffinScheduledMealStatusSchema = z.enum([
  "scheduled",
  "delivered",
  "skipped",
  "closed",
]);

export const TiffinScheduledMealSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  meal: TiffinMealTypeSchema,
  dishName: z.string(),
  status: TiffinScheduledMealStatusSchema,
});

export const TiffinSubscriptionSchema = z.object({
  id: ObjectIdSchema,
  userId: ObjectIdSchema,
  planId: ObjectIdSchema,
  planName: z.string(),
  diet: TiffinDietSchema,
  /** Snapshotted from the plan at subscribe time — "regular" for old subs. */
  tier: TiffinTierSchema.default("regular"),
  style: TiffinPlanStyleSchema,
  duration: TiffinPlanDurationSchema,
  /** the customer's meal choice for a "single" style plan. */
  mealType: TiffinMealTypeSchema.nullable(),
  startDate: z.string(),
  endDate: z.string(),
  address: AddressSchema,
  status: z.enum(["active", "paused", "cancelled", "completed"]),
  pausedAt: z.string().nullable(),
  meals: z.array(TiffinScheduledMealSchema),
  pricePaid: RupeesSchema,
  payment: z.object({
    method: PaymentMethodSchema,
    status: PaymentStatusSchema,
    amount: RupeesSchema,
    razorpay: RazorpayRefsSchema,
  }),
  cancellation: z
    .object({
      cancelledAt: z.string(),
      refundPercent: z.number(),
      refundAmount: RupeesSchema,
      refundStatus: z
        .enum(["not-applicable", "recorded", "processing", "failed"])
        .default("not-applicable"),
    })
    .nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TiffinSubscription = z.infer<typeof TiffinSubscriptionSchema>;

export const CreateTiffinSubscriptionRequestSchema = z.object({
  planId: z.string(),
  /** required only for a "single" style plan. */
  mealType: TiffinMealTypeSchema.optional(),
  startDate: z.string(),
  address: AddressSchema,
  /** Subscriptions are Razorpay-only — an up-front commitment, unlike a same-day
   * single meal which still allows COD. */
  paymentMethod: z.literal("razorpay").default("razorpay"),
});
export type CreateTiffinSubscriptionRequest = z.infer<
  typeof CreateTiffinSubscriptionRequestSchema
>;

export const CreateTiffinSubscriptionResponseSchema = z.object({
  subscription: TiffinSubscriptionSchema,
  /** present only when paymentMethod === "razorpay". */
  razorpayOrder: RazorpayOrderInfoSchema.nullable(),
});
export type CreateTiffinSubscriptionResponse = z.infer<
  typeof CreateTiffinSubscriptionResponseSchema
>;

// ---------------------------------------------------------------------------
// Single-meal order (no subscription)
// ---------------------------------------------------------------------------

export const TiffinSingleMealOrderSchema = z.object({
  id: ObjectIdSchema,
  userId: ObjectIdSchema.nullable(),
  accessToken: z.string(),
  code: z.string(),
  diet: TiffinDietSchema,
  tier: TiffinTierSchema,
  meal: TiffinMealTypeSchema,
  date: z.string(),
  dishName: z.string(),
  imageUrl: z.string().nullable().default(null),
  quantity: z.number().int().min(1),
  addOns: z.array(z.object({ name: z.string(), price: RupeesSchema })),
  baseprice: RupeesSchema,
  addOnsPrice: RupeesSchema,
  total: RupeesSchema,
  address: AddressSchema,
  contactName: z.string(),
  contactPhone: z.string(),
  status: z.enum(["received", "preparing", "out-for-delivery", "delivered", "cancelled"]),
  statusHistory: z.array(z.object({ status: z.string(), at: z.string() })),
  deliveryPartner: z
    .object({ name: z.string(), phone: z.string(), vehicle: z.string() })
    .nullable(),
  payment: z.object({
    method: PaymentMethodSchema,
    status: PaymentStatusSchema,
    amount: RupeesSchema,
    razorpay: RazorpayRefsSchema,
  }),
  cancellation: z
    .object({
      cancelledAt: z.string(),
      refundPercent: z.number(),
      refundAmount: RupeesSchema,
      refundStatus: z
        .enum(["not-applicable", "recorded", "processing", "failed"])
        .default("not-applicable"),
    })
    .nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TiffinSingleMealOrder = z.infer<typeof TiffinSingleMealOrderSchema>;

export const CreateTiffinSingleMealRequestSchema = z.object({
  diet: TiffinDietSchema,
  tier: TiffinTierSchema,
  meal: TiffinMealTypeSchema,
  date: z.string(),
  quantity: z.number().int().min(1).max(MAX_SINGLE_MEAL_QUANTITY),
  addOns: z.array(z.string()).default([]),
  address: AddressSchema,
  paymentMethod: PaymentMethodSchema,
  guestName: z.string().max(120).optional(),
  guestPhone: z.string().max(15).optional(),
});
export type CreateTiffinSingleMealRequest = z.infer<
  typeof CreateTiffinSingleMealRequestSchema
>;

export const CreateTiffinSingleMealResponseSchema = z.object({
  order: TiffinSingleMealOrderSchema,
  /** present only when paymentMethod === "razorpay". */
  razorpayOrder: RazorpayOrderInfoSchema.nullable(),
});
export type CreateTiffinSingleMealResponse = z.infer<
  typeof CreateTiffinSingleMealResponseSchema
>;

// ---------------------------------------------------------------------------
// Emergency closure
// ---------------------------------------------------------------------------

export const TiffinClosureSchema = z.object({
  id: ObjectIdSchema,
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().default(""),
  createdAt: z.string(),
});
export type TiffinClosure = z.infer<typeof TiffinClosureSchema>;

export const CreateTiffinClosureRequestSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().max(300).default(""),
});
export type CreateTiffinClosureRequest = z.infer<typeof CreateTiffinClosureRequestSchema>;
