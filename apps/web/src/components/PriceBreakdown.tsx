"use client";

import type { DiscountReason, PricingResult, RewardReason } from "@lickyeat/shared-types";
import { rupees } from "@/lib/format";
import { cn } from "@/components/ui/misc";

/**
 * TypeScript's exhaustiveness check on these Records is the safety net: add a new
 * DiscountReason / RewardReason to shared-types and forget it here → compile
 * error (see AGENT.md §3.7).
 */
const DISCOUNT_LABELS: Record<DiscountReason, string> = {
  none: "",
  "premium-member": "Premium member — 25% off",
  "quantity-tier": "Bundle discount",
};

const REWARD_LABELS: Record<RewardReason, string> = {
  none: "",
  "milestone-half-cold-coffee": "Milestone reward — 50% off a cold coffee",
  "milestone-free-drink": "Milestone reward — a drink on us",
};

export function PriceBreakdown({
  pricing,
  pending,
}: {
  pricing: PricingResult;
  pending?: boolean;
}) {
  return (
    <dl className={cn("space-y-2 text-sm transition-opacity", pending && "opacity-60")}>
      <Row label="Subtotal" value={rupees(pricing.subtotal)} />
      {pricing.discountAmount > 0 && (
        <Row
          good
          label={`${DISCOUNT_LABELS[pricing.discountReason]}${
            pricing.discountReason === "quantity-tier" ? ` (${pricing.discountPercent}%)` : ""
          }`}
          value={`− ${rupees(pricing.discountAmount)}`}
        />
      )}
      {pricing.rewardAmount > 0 && (
        <Row good label={REWARD_LABELS[pricing.rewardReason]} value={`− ${rupees(pricing.rewardAmount)}`} />
      )}
      {pricing.couponDiscount > 0 && (
        <Row good label={`Coupon ${pricing.couponCode ?? ""}`} value={`− ${rupees(pricing.couponDiscount)}`} />
      )}
      <Row
        label={pricing.deliveryFeeWaived ? "Delivery (free)" : "Delivery fee"}
        value={pricing.deliveryFee > 0 ? rupees(pricing.deliveryFee) : "Free"}
      />
      <Row label={`Taxes (${pricing.taxPercent}%)`} value={rupees(pricing.taxAmount)} />
      <div className="mt-2 flex items-center justify-between border-t border-line pt-3 text-base font-extrabold">
        <span>Total</span>
        <span>{rupees(pricing.total)}</span>
      </div>
    </dl>
  );
}

function Row({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={good ? "text-emerald-700" : "text-muted"}>{label}</dt>
      <dd className={cn("tabular-nums", good ? "text-emerald-700" : "text-charcoal")}>{value}</dd>
    </div>
  );
}
