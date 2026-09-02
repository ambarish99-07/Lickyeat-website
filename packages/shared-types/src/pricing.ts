import { z } from "zod";
import { BrandIdSchema, PercentSchema, RupeesSchema } from "./common.js";

// ---------------------------------------------------------------------------
// Tunable business constants (single source of truth — imported by pricing pkg)
// ---------------------------------------------------------------------------

export const FREE_DELIVERY_SUBTOTAL_THRESHOLD = 499;
export const FLAT_DELIVERY_FEE = 39;
export const TAX_PERCENT = 5;

/** Loyalty "premium member" tier (earned, not purchased — see §4.2/§4.3). */
export const PREMIUM_TIER_MIN_COMPLETED_ORDERS = 15;
export const PREMIUM_TIER_DISCOUNT_PERCENT = 25;

/** Quantity-tier fallback discount, keyed by non-combo item count. */
export const QUANTITY_TIER_DISCOUNTS: ReadonlyArray<{ minItems: number; percent: number }> = [
  { minItems: 4, percent: 20 },
  { minItems: 3, percent: 15 },
  { minItems: 2, percent: 10 },
  { minItems: 1, percent: 0 },
];

/** Milestone rewards repeat every N orders (registered users only). */
export const MILESTONE_CYCLE = 10;
/** Orders ...6, 16, 26 → half off cheapest cold-coffee unit. */
export const MILESTONE_HALF_COLD_COFFEE_OFFSET = 6;
/** Orders ...10, 20, 30 → cheapest eligible drink free. */
export const MILESTONE_FREE_DRINK_OFFSET = 0;
export const MILESTONE_HALF_PERCENT = 50;

export const COMBO_DISCOUNT_PERCENT = 15;

// ---------------------------------------------------------------------------
// Discount / reward reason unions — MUST stay in sync with:
//   - packages/pricing/src/types.ts (DiscountReason TS union)
//   - apps/api/src/db/models/Order.model.ts (Mongoose enum)
//   - apps/web/src/components/PriceBreakdown.tsx (DISCOUNT_LABELS / REWARD_LABELS)
// The web component's exhaustive Record is the compile-time safety net.
// ---------------------------------------------------------------------------

export const DiscountReasonSchema = z.enum([
  "none",
  "premium-member",
  "quantity-tier",
]);
export type DiscountReason = z.infer<typeof DiscountReasonSchema>;

export const RewardReasonSchema = z.enum([
  "none",
  "milestone-half-cold-coffee",
  "milestone-free-drink",
]);
export type RewardReason = z.infer<typeof RewardReasonSchema>;

// ---------------------------------------------------------------------------
// Pricing engine I/O contract
// ---------------------------------------------------------------------------

/**
 * One resolved cart line as the pricing engine sees it. Prices are ALWAYS
 * server-resolved before they reach here — the client never submits a price.
 */
export const PricingCartLineSchema = z.object({
  lineId: z.string(),
  brandId: BrandIdSchema,
  name: z.string(),
  /** Per-unit base price after size resolution, BEFORE any discount. */
  unitBasePrice: RupeesSchema,
  quantity: z.number().int().min(1),
  /** Per-unit add-on total (already resolved from the shared catalog). */
  unitAddOnsPrice: RupeesSchema.default(0),
  /** Per-item markdown, applied before cart-level discounts. */
  salePercent: PercentSchema.default(0),
  isCombo: z.boolean().default(false),
  /** Loose category tag used for milestone-reward eligibility checks. */
  category: z.string().default(""),
});
export type PricingCartLine = z.infer<typeof PricingCartLineSchema>;

export const LoyaltyStateSchema = z.object({
  isLoggedIn: z.boolean(),
  /** Completed (delivered / paid-Razorpay) orders BEFORE this one. */
  completedOrderCount: z.number().int().nonnegative(),
  /** Admin can force premium-tier treatment regardless of order count. */
  premiumTierOverride: z.boolean().default(false),
  /** An active PAID Premium Membership (separate mechanism, §4.3). */
  hasActivePaidMembership: z.boolean().default(false),
  /** Self-reported "within delivery radius of shop" placeholder. */
  withinFreeDeliveryRadius: z.boolean().default(false),
});
export type LoyaltyState = z.infer<typeof LoyaltyStateSchema>;

export const PricingInputSchema = z.object({
  lines: z.array(PricingCartLineSchema),
  loyalty: LoyaltyStateSchema,
  /** Resolved server-side from the coupon code; 0 when no valid coupon. */
  couponDiscountAmount: RupeesSchema.default(0),
  couponCode: z.string().nullable().default(null),
});
export type PricingInput = z.infer<typeof PricingInputSchema>;

export const PricingLineResultSchema = z.object({
  lineId: z.string(),
  name: z.string(),
  quantity: z.number().int(),
  unitBasePrice: RupeesSchema,
  unitAddOnsPrice: RupeesSchema,
  /** unit price after per-item salePercent only. */
  unitSalePrice: RupeesSchema,
  lineSubtotal: RupeesSchema,
  isCombo: z.boolean(),
});

export const PricingResultSchema = z.object({
  lines: z.array(PricingLineResultSchema),
  subtotal: RupeesSchema,
  comboSubtotal: RupeesSchema,
  nonComboSubtotal: RupeesSchema,
  discountReason: DiscountReasonSchema,
  discountPercent: PercentSchema,
  discountAmount: RupeesSchema,
  rewardReason: RewardReasonSchema,
  rewardAmount: RupeesSchema,
  couponCode: z.string().nullable(),
  couponDiscount: RupeesSchema,
  deliveryFee: RupeesSchema,
  deliveryFeeWaived: z.boolean(),
  taxableAmount: RupeesSchema,
  taxPercent: PercentSchema,
  taxAmount: RupeesSchema,
  total: RupeesSchema,
});
export type PricingResult = z.infer<typeof PricingResultSchema>;
