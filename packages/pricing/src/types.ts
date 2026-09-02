/**
 * The pricing package is pure and I/O-free. It re-exports the pricing contract
 * from @lickyeat/shared-types so callers have one import site, but adds no DB,
 * network, or brand-specific behaviour of its own.
 */
export type {
  PricingCartLine,
  PricingInput,
  PricingResult,
  LoyaltyState,
  DiscountReason,
  RewardReason,
} from "@lickyeat/shared-types";

export {
  FREE_DELIVERY_SUBTOTAL_THRESHOLD,
  FLAT_DELIVERY_FEE,
  TAX_PERCENT,
  PREMIUM_TIER_MIN_COMPLETED_ORDERS,
  PREMIUM_TIER_DISCOUNT_PERCENT,
  QUANTITY_TIER_DISCOUNTS,
  MILESTONE_CYCLE,
  MILESTONE_HALF_COLD_COFFEE_OFFSET,
  MILESTONE_HALF_PERCENT,
  COMBO_DISCOUNT_PERCENT,
} from "@lickyeat/shared-types";

/** Categories/tags the milestone rewards treat as eligible. Kept loose on purpose. */
export const COLD_COFFEE_MATCHERS = ["cold-coffee", "cold coffee", "iced coffee"];
export const DRINK_MATCHERS = ["drink", "shake", "mocktail", "coffee", "beverage", "cooler"];

export function roundRupees(n: number): number {
  return Math.round(n);
}
