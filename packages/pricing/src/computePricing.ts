import type {
  DiscountReason,
  PricingCartLine,
  PricingInput,
  PricingResult,
  RewardReason,
} from "@lickyeat/shared-types";
import {
  COLD_COFFEE_MATCHERS,
  DRINK_MATCHERS,
  FLAT_DELIVERY_FEE,
  FREE_DELIVERY_SUBTOTAL_THRESHOLD,
  MILESTONE_CYCLE,
  MILESTONE_HALF_COLD_COFFEE_OFFSET,
  MILESTONE_HALF_PERCENT,
  PREMIUM_TIER_DISCOUNT_PERCENT,
  PREMIUM_TIER_MIN_COMPLETED_ORDERS,
  QUANTITY_TIER_DISCOUNTS,
  TAX_PERCENT,
  roundRupees,
} from "./types.js";

function unitSalePrice(line: PricingCartLine): number {
  if (line.salePercent <= 0) return line.unitBasePrice;
  return roundRupees(line.unitBasePrice * (1 - line.salePercent / 100));
}

function categoryMatches(category: string, matchers: readonly string[]): boolean {
  const c = category.toLowerCase();
  return matchers.some((m) => c.includes(m));
}

function isPremiumTier(loyalty: PricingInput["loyalty"]): boolean {
  return (
    loyalty.premiumTierOverride ||
    loyalty.completedOrderCount >= PREMIUM_TIER_MIN_COMPLETED_ORDERS
  );
}

function quantityTierPercent(itemCount: number): number {
  for (const tier of QUANTITY_TIER_DISCOUNTS) {
    if (itemCount >= tier.minItems) return tier.percent;
  }
  return 0;
}

/**
 * The single pricing function. Mobile/web cart previews AND the server's
 * order-creation path both call this with identical inputs, so a live total can
 * never structurally drift from what is charged.
 */
export function computePricing(input: PricingInput): PricingResult {
  const lines = input.lines.map((line) => {
    const usp = unitSalePrice(line);
    const perUnit = usp + line.unitAddOnsPrice;
    const lineSubtotal = roundRupees(perUnit * line.quantity);
    return {
      lineId: line.lineId,
      name: line.name,
      quantity: line.quantity,
      unitBasePrice: line.unitBasePrice,
      unitAddOnsPrice: line.unitAddOnsPrice,
      unitSalePrice: usp,
      lineSubtotal,
      isCombo: line.isCombo,
      _src: line,
      _perUnit: perUnit,
    };
  });

  const subtotal = lines.reduce((s, l) => s + l.lineSubtotal, 0);
  const comboSubtotal = lines
    .filter((l) => l.isCombo)
    .reduce((s, l) => s + l.lineSubtotal, 0);
  const nonComboSubtotal = subtotal - comboSubtotal;
  const nonComboItemCount = lines
    .filter((l) => !l.isCombo)
    .reduce((s, l) => s + l.quantity, 0);

  // --- Discount (premium tier, else quantity tier) ---
  let discountReason: DiscountReason = "none";
  let discountPercent = 0;
  if (isPremiumTier(input.loyalty) && nonComboSubtotal > 0) {
    discountReason = "premium-member";
    discountPercent = PREMIUM_TIER_DISCOUNT_PERCENT;
  } else if (nonComboSubtotal > 0) {
    const pct = quantityTierPercent(nonComboItemCount);
    if (pct > 0) {
      discountReason = "quantity-tier";
      discountPercent = pct;
    }
  }
  const discountAmount = roundRupees((nonComboSubtotal * discountPercent) / 100);

  // --- Milestone reward (registered users only) ---
  let rewardReason: RewardReason = "none";
  let rewardAmount = 0;
  if (input.loyalty.isLoggedIn) {
    const orderNumber = input.loyalty.completedOrderCount + 1;
    const cyclePos = orderNumber % MILESTONE_CYCLE; // 0 == free drink milestone
    if (cyclePos === MILESTONE_HALF_COLD_COFFEE_OFFSET) {
      const cheapest = cheapestUnit(lines, COLD_COFFEE_MATCHERS);
      if (cheapest != null) {
        rewardReason = "milestone-half-cold-coffee";
        rewardAmount = roundRupees((cheapest * MILESTONE_HALF_PERCENT) / 100);
      }
    } else if (cyclePos === 0) {
      const cheapest = cheapestUnit(lines, DRINK_MATCHERS);
      if (cheapest != null) {
        rewardReason = "milestone-free-drink";
        rewardAmount = cheapest;
      }
    }
  }

  // --- Coupon (applied last, before tax) ---
  const couponRoom = Math.max(0, subtotal - discountAmount - rewardAmount);
  const couponDiscount = Math.min(input.couponDiscountAmount, couponRoom);

  const taxableAmount = Math.max(
    0,
    subtotal - discountAmount - rewardAmount - couponDiscount,
  );
  const taxAmount = roundRupees((taxableAmount * TAX_PERCENT) / 100);

  // --- Delivery fee ---
  const premiumTier = isPremiumTier(input.loyalty);
  const deliveryFeeWaived =
    subtotal >= FREE_DELIVERY_SUBTOTAL_THRESHOLD ||
    (premiumTier && input.loyalty.withinFreeDeliveryRadius) ||
    input.loyalty.hasActivePaidMembership;
  const deliveryFee = deliveryFeeWaived ? 0 : FLAT_DELIVERY_FEE;

  const total = taxableAmount + taxAmount + deliveryFee;

  return {
    lines: lines.map((l) => ({
      lineId: l.lineId,
      name: l.name,
      quantity: l.quantity,
      unitBasePrice: l.unitBasePrice,
      unitAddOnsPrice: l.unitAddOnsPrice,
      unitSalePrice: l.unitSalePrice,
      lineSubtotal: l.lineSubtotal,
      isCombo: l.isCombo,
    })),
    subtotal,
    comboSubtotal,
    nonComboSubtotal,
    discountReason,
    discountPercent,
    discountAmount,
    rewardReason,
    rewardAmount,
    couponCode: input.couponCode,
    couponDiscount,
    deliveryFee,
    deliveryFeeWaived,
    taxableAmount,
    taxPercent: TAX_PERCENT,
    taxAmount,
    total,
  };
}

function cheapestUnit(
  lines: ReadonlyArray<{ _src: PricingCartLine; unitSalePrice: number; isCombo: boolean }>,
  matchers: readonly string[],
): number | null {
  const eligible = lines
    .filter((l) => !l.isCombo && categoryMatches(l._src.category, matchers))
    .map((l) => l.unitSalePrice);
  if (eligible.length === 0) return null;
  return Math.min(...eligible);
}
