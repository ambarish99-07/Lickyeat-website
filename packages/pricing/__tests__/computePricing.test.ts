import { describe, expect, it } from "vitest";
import { computePricing } from "../src/computePricing.js";
import { computeComboPrice } from "../src/combo.js";
import type { LoyaltyState, PricingCartLine, PricingInput } from "../src/types.js";

const guest: LoyaltyState = {
  isLoggedIn: false,
  completedOrderCount: 0,
  premiumTierOverride: false,
  hasActivePaidMembership: false,
  withinFreeDeliveryRadius: false,
};

function line(over: Partial<PricingCartLine> = {}): PricingCartLine {
  return {
    lineId: over.lineId ?? "l1",
    brandId: over.brandId ?? "tbc",
    name: over.name ?? "Cold Coffee",
    unitBasePrice: over.unitBasePrice ?? 100,
    quantity: over.quantity ?? 1,
    unitAddOnsPrice: over.unitAddOnsPrice ?? 0,
    salePercent: over.salePercent ?? 0,
    isCombo: over.isCombo ?? false,
    category: over.category ?? "cold-coffee",
  };
}

function input(over: Partial<PricingInput>): PricingInput {
  return {
    lines: over.lines ?? [line()],
    loyalty: over.loyalty ?? guest,
    couponDiscountAmount: over.couponDiscountAmount ?? 0,
    couponCode: over.couponCode ?? null,
  };
}

describe("quantity-tier discount", () => {
  it("1 item → 0%", () => {
    const r = computePricing(input({ lines: [line({ quantity: 1, unitBasePrice: 100 })] }));
    expect(r.discountReason).toBe("none");
    expect(r.discountAmount).toBe(0);
    expect(r.subtotal).toBe(100);
  });

  it("2 items → 10% of non-combo subtotal", () => {
    const r = computePricing(input({ lines: [line({ quantity: 2, unitBasePrice: 100 })] }));
    expect(r.discountReason).toBe("quantity-tier");
    expect(r.discountPercent).toBe(10);
    expect(r.discountAmount).toBe(20);
  });

  it("3 items → 15%", () => {
    const r = computePricing(input({ lines: [line({ quantity: 3, unitBasePrice: 100 })] }));
    expect(r.discountPercent).toBe(15);
    expect(r.discountAmount).toBe(45);
  });

  it("4+ items → 20%", () => {
    const r = computePricing(input({ lines: [line({ quantity: 6, unitBasePrice: 100 })] }));
    expect(r.discountPercent).toBe(20);
    expect(r.discountAmount).toBe(120);
  });
});

describe("premium-member tier", () => {
  it("15+ completed orders → flat 25% off non-combo subtotal", () => {
    const r = computePricing(
      input({
        lines: [line({ quantity: 1, unitBasePrice: 400 })],
        loyalty: { ...guest, isLoggedIn: true, completedOrderCount: 15 },
      }),
    );
    expect(r.discountReason).toBe("premium-member");
    expect(r.discountAmount).toBe(100);
  });

  it("admin override forces the tier regardless of count", () => {
    const r = computePricing(
      input({
        lines: [line({ quantity: 1, unitBasePrice: 400 })],
        loyalty: { ...guest, premiumTierOverride: true },
      }),
    );
    expect(r.discountReason).toBe("premium-member");
    expect(r.discountAmount).toBe(100);
  });

  it("premium tier + within radius → free delivery even below threshold", () => {
    const r = computePricing(
      input({
        lines: [line({ quantity: 1, unitBasePrice: 200 })],
        loyalty: {
          ...guest,
          isLoggedIn: true,
          completedOrderCount: 20,
          withinFreeDeliveryRadius: true,
        },
      }),
    );
    expect(r.deliveryFeeWaived).toBe(true);
    expect(r.deliveryFee).toBe(0);
  });
});

describe("delivery fee", () => {
  it("₹39 flat below the free threshold", () => {
    const r = computePricing(input({ lines: [line({ unitBasePrice: 100 })] }));
    expect(r.deliveryFee).toBe(39);
  });
  it("free at subtotal ≥ ₹499", () => {
    const r = computePricing(input({ lines: [line({ unitBasePrice: 499 })] }));
    expect(r.deliveryFee).toBe(0);
    expect(r.deliveryFeeWaived).toBe(true);
  });
  it("free with an active paid membership regardless of subtotal", () => {
    const r = computePricing(
      input({
        lines: [line({ unitBasePrice: 100 })],
        loyalty: { ...guest, hasActivePaidMembership: true },
      }),
    );
    expect(r.deliveryFee).toBe(0);
  });
});

describe("tax", () => {
  it("5% on subtotal - discount - reward - coupon", () => {
    const r = computePricing(input({ lines: [line({ quantity: 2, unitBasePrice: 100 })] }));
    // subtotal 200, discount 20 -> taxable 180 -> tax 9
    expect(r.taxableAmount).toBe(180);
    expect(r.taxAmount).toBe(9);
    expect(r.total).toBe(180 + 9 + 39);
  });
});

describe("per-item salePercent", () => {
  it("stacks with cart-level discount", () => {
    const r = computePricing(
      input({ lines: [line({ quantity: 2, unitBasePrice: 100, salePercent: 10 })] }),
    );
    // unit sale price 90, subtotal 180, qty-tier 10% -> discount 18
    expect(r.subtotal).toBe(180);
    expect(r.discountAmount).toBe(18);
  });
});

describe("combos", () => {
  it("computeComboPrice is 15% off the constituents", () => {
    expect(computeComboPrice([100, 100])).toBe(170);
    expect(computeComboPrice([120, 80, 100])).toBe(255);
  });

  it("combo subtotal is excluded from the quantity-tier discount base", () => {
    const r = computePricing(
      input({
        lines: [
          line({ lineId: "c1", isCombo: true, unitBasePrice: 170, quantity: 1 }),
          line({ lineId: "i1", isCombo: false, unitBasePrice: 100, quantity: 2 }),
        ],
      }),
    );
    expect(r.comboSubtotal).toBe(170);
    expect(r.nonComboSubtotal).toBe(200);
    expect(r.discountAmount).toBe(20); // 10% of 200 only
  });
});

describe("milestone rewards (registered only)", () => {
  it("order #6 → 50% off cheapest cold-coffee unit", () => {
    const r = computePricing(
      input({
        lines: [line({ unitBasePrice: 120, category: "cold-coffee" })],
        loyalty: { ...guest, isLoggedIn: true, completedOrderCount: 5 },
      }),
    );
    expect(r.rewardReason).toBe("milestone-half-cold-coffee");
    expect(r.rewardAmount).toBe(60);
  });

  it("order #10 → cheapest eligible drink free", () => {
    const r = computePricing(
      input({
        lines: [
          line({ lineId: "a", unitBasePrice: 150, category: "shake" }),
          line({ lineId: "b", unitBasePrice: 90, category: "mocktail" }),
        ],
        loyalty: { ...guest, isLoggedIn: true, completedOrderCount: 9 },
      }),
    );
    expect(r.rewardReason).toBe("milestone-free-drink");
    expect(r.rewardAmount).toBe(90);
  });

  it("guests get no milestone reward", () => {
    const r = computePricing(
      input({
        lines: [line({ unitBasePrice: 120 })],
        loyalty: { ...guest, completedOrderCount: 5 },
      }),
    );
    expect(r.rewardReason).toBe("none");
  });
});

describe("coupons", () => {
  it("applied after discount/reward, before tax, clamped to remaining amount", () => {
    const r = computePricing(
      input({
        lines: [line({ quantity: 2, unitBasePrice: 100 })],
        couponDiscountAmount: 50,
        couponCode: "SAVE50",
      }),
    );
    // subtotal 200, discount 20 -> room 180, coupon 50 -> taxable 130
    expect(r.couponDiscount).toBe(50);
    expect(r.taxableAmount).toBe(130);
    expect(r.couponCode).toBe("SAVE50");
  });

  it("never exceeds the remaining amount", () => {
    const r = computePricing(
      input({ lines: [line({ unitBasePrice: 100 })], couponDiscountAmount: 999 }),
    );
    expect(r.couponDiscount).toBe(100);
    expect(r.taxableAmount).toBe(0);
  });
});
