import type { Address, LoyaltyState } from "@lickyeat/shared-types";
import type { AuthedUser } from "../../middleware/auth.js";
import { PremiumMembershipModel } from "../../db/models/PremiumMembership.model.js";

export async function buildLoyaltyState(
  user: AuthedUser | undefined,
  address?: Address | null,
): Promise<LoyaltyState> {
  if (!user) {
    return {
      isLoggedIn: false,
      completedOrderCount: 0,
      premiumTierOverride: false,
      hasActivePaidMembership: false,
      withinFreeDeliveryRadius: address?.withinDeliveryRadius ?? false,
    };
  }

  const membership = await PremiumMembershipModel.findOne({
    userId: user.id,
    "payment.status": "paid",
    expiresAt: { $gt: new Date() },
  }).lean();

  return {
    isLoggedIn: true,
    completedOrderCount: user.completedOrderCount,
    premiumTierOverride: user.premiumTierOverride,
    hasActivePaidMembership: Boolean(membership),
    withinFreeDeliveryRadius: address?.withinDeliveryRadius ?? false,
  };
}
