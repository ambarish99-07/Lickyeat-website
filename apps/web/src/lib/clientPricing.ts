import { computePricing } from "@lickyeat/pricing";
import type { PricingCartLine, PricingResult, User } from "@lickyeat/shared-types";

/**
 * Instant, optimistic pricing estimate using the SAME pure engine the server
 * runs (@lickyeat/pricing). It cannot know the coupon amount, an active paid
 * membership or the delivery radius yet, so the authoritative /pricing/preview
 * response always supersedes it — this only removes the first-paint flicker.
 */
export function estimatePricing(
  lines: PricingCartLine[],
  user: User | null,
): PricingResult {
  return computePricing({
    lines,
    loyalty: {
      isLoggedIn: Boolean(user),
      completedOrderCount: user?.completedOrderCount ?? 0,
      premiumTierOverride: user?.premiumTierOverride ?? false,
      hasActivePaidMembership: false,
      withinFreeDeliveryRadius: false,
    },
    couponDiscountAmount: 0,
    couponCode: null,
  });
}
