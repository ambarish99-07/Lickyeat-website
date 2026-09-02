"use client";

import type { DiscountReason, PricingResult, RewardReason } from "@lickyeat/shared-types";
import { rupees } from "@/lib/format";

/**
 * TypeScript's exhaustiveness check on these Records is the safety net that
 * forces a compile error if a new DiscountReason / RewardReason is added in
 * shared-types but not surfaced here (see AGENT.md §3.7).
 */
const DISCOUNT_LABELS: Record<DiscountReason, string> = {
  none: "",
  "premium-member": "Premium member discount",
  "quantity-tier": "Bundle discount",
};

const REWARD_LABELS: Record<RewardReason, string> = {
  none: "",
  "milestone-half-cold-coffee": "Milestone reward — 50% off a cold coffee",
  "milestone-free-drink": "Milestone reward — free drink",
};

export function PriceBreakdown({ pricing }: { pricing: PricingResult }) {
  return (
    <dl className="space-y-1.5 text-sm">
      <Row label="Subtotal" value={rupees(pricing.subtotal)} />
      {pricing.discountAmount > 0 && (
        <Row
          label={`${DISCOUNT_LABELS[pricing.discountReason]} (${pricing.discountPercent}%)`}
          value={`− ${rupees(pricing.discountAmount)}`}
          good
        />
      )}
      {pricing.rewardAmount > 0 && (
        <Row
          label={REWARD_LABELS[pricing.rewardReason]}
          value={`− ${rupees(pricing.rewardAmount)}`}
          good
        />
      )}
      {pricing.couponDiscount > 0 && (
        <Row
          label={`Coupon ${pricing.couponCode ?? ""}`}
          value={`− ${rupees(pricing.couponDiscount)}`}
          good
        />
      )}
      <Row
        label={`Delivery fee${pricing.deliveryFeeWaived ? " (waived)" : ""}`}
        value={pricing.deliveryFee > 0 ? rupees(pricing.deliveryFee) : "Free"}
      />
      <Row label={`Tax (${pricing.taxPercent}%)`} value={rupees(pricing.taxAmount)} />
      <div className="!mt-3 flex items-center justify-between border-t border-black/10 pt-3 text-base font-bold">
        <span>Total</span>
        <span>{rupees(pricing.total)}</span>
      </div>
    </dl>
  );
}

function Row({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={good ? "text-green-700" : "text-black/60"}>{label}</dt>
      <dd className={good ? "text-green-700" : ""}>{value}</dd>
    </div>
  );
}
