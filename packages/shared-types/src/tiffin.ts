import { z } from "zod";
import { ObjectIdSchema, RupeesSchema } from "./common.js";
import { AddressSchema } from "./auth.js";
import { PaymentMethodSchema, PaymentStatusSchema, RazorpayRefsSchema } from "./order.js";

/** GG Tiffin is a structurally separate order universe — it never touches Order. */
export const GG_TIFFIN_BRAND_ID = "gg-tiffin" as const;

export const TiffinDietSchema = z.enum(["veg", "non-veg"]);
export type TiffinDiet = z.infer<typeof TiffinDietSchema>;

export const TiffinTierSchema = z.enum(["regular", "mini", "premium"]);
export type TiffinTier = z.infer<typeof TiffinTierSchema>;

export const TiffinMealTypeSchema = z.enum(["breakfast", "lunch", "dinner"]);
export type TiffinMealType = z.infer<typeof TiffinMealTypeSchema>;

/** single / twice / thrice daily. */
export const TiffinMealStyleSchema = z.enum(["single", "twice", "thrice"]);
export type TiffinMealStyle = z.infer<typeof TiffinMealStyleSchema>;

export const TiffinPlanDurationSchema = z.enum(["weekly", "monthly"]);
export type TiffinPlanDuration = z.infer<typeof TiffinPlanDurationSchema>;

export const TIFFIN_PLAN_DAYS: Record<TiffinPlanDuration, number> = {
  weekly: 7,
  monthly: 30,
};

// Cancellation / refund policy (subscriptions)
export const CANCELLATION_FULL_REFUND_WINDOW_DAYS = 15;
export const CANCELLATION_REFUND_PERCENT = 0; // none after the window
/** Weekly plans cannot be cancelled at all. */
export const WEEKLY_PLAN_CANCELLABLE = false;

// Single-meal order cancellation
export const SINGLE_MEAL_CANCELLATION_WINDOW_MINUTES = 15;
export const MAX_SINGLE_MEAL_QUANTITY = 10;

// Meal ordering cutoffs (IST). Order today's meal only before its cutoff hour.
export const MEAL_ORDERING_CUTOFF_HOUR_IST: Record<TiffinMealType, number> = {
  breakfast: 21, // 9pm the night before
  lunch: 9,
  dinner: 15,
};

// ---------------------------------------------------------------------------
// Curated weekly menu — a specific dish per weekday per meal type.
// Index 0 = Sunday ... 6 = Saturday. Non-veg days override specific slots.
// ---------------------------------------------------------------------------

export type WeeklyDishTable = readonly [string, string, string, string, string, string, string];

export const TIFFIN_REGULAR_VEG_MENU: Record<TiffinMealType, WeeklyDishTable> = {
  breakfast: ["Poha", "Aloo Paratha", "Upma", "Besan Chilla", "Idli Sambar", "Bread Omelette", "Sabudana Khichdi"],
  lunch: ["Rajma Chawal", "Aloo Gobhi", "Chole", "Kadhi Pakora", "Matar Paneer", "Bhindi Masala", "Dal Tadka"],
  dinner: ["Mix Veg", "Aloo Parwal", "Lauki Masala", "Baingan Bharta", "Matar Chole", "Palak Paneer", "Jeera Aloo"],
};

/** Non-veg overrides (applied on top of the veg table for non-veg subscribers). */
export const TIFFIN_NONVEG_OVERRIDES: Partial<Record<TiffinMealType, Partial<Record<number, string>>>> = {
  lunch: { 0: "Chicken Curry", 3: "Egg Curry", 6: "Chicken Masala" },
  dinner: { 2: "Egg Bhurji", 5: "Chicken Curry" },
};

export function getTiffinDishForDay(
  meal: TiffinMealType,
  diet: TiffinDiet,
  weekday: number,
): string {
  const base = TIFFIN_REGULAR_VEG_MENU[meal][weekday as 0] ?? "Home-style Thali";
  if (diet === "non-veg") {
    const override = TIFFIN_NONVEG_OVERRIDES[meal]?.[weekday];
    if (override) return override;
  }
  return base;
}

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
  diet: TiffinDietSchema,
  tier: z.literal("regular"),
  mealStyle: TiffinMealStyleSchema,
  duration: TiffinPlanDurationSchema,
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
    })
    .nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TiffinSubscription = z.infer<typeof TiffinSubscriptionSchema>;

export const CreateTiffinSubscriptionRequestSchema = z.object({
  diet: TiffinDietSchema,
  mealStyle: TiffinMealStyleSchema,
  duration: TiffinPlanDurationSchema,
  startDate: z.string(),
  address: AddressSchema,
  paymentMethod: PaymentMethodSchema,
});
export type CreateTiffinSubscriptionRequest = z.infer<
  typeof CreateTiffinSubscriptionRequestSchema
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
    .object({ cancelledAt: z.string(), refundPercent: z.number(), refundAmount: RupeesSchema })
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
