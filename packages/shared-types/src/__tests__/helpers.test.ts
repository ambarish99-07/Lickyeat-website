import { describe, expect, it } from "vitest";
import { resolveCouponDiscount } from "../coupon.js";
import { getTiffinDishForDay } from "../tiffin.js";

describe("resolveCouponDiscount", () => {
  const base = {
    kind: "percent" as const,
    value: 20,
    maxDiscount: null,
    minOrderAmount: 200,
    brandId: null,
    expiresAt: null,
    isActive: true,
  };

  it("applies a percent discount above the minimum", () => {
    const r = resolveCouponDiscount(base, { subtotal: 300, brandId: "tbc" });
    expect(r).toEqual({ ok: true, discountAmount: 60 });
  });

  it("caps at maxDiscount", () => {
    const r = resolveCouponDiscount({ ...base, maxDiscount: 40 }, { subtotal: 300, brandId: "tbc" });
    expect(r).toEqual({ ok: true, discountAmount: 40 });
  });

  it("rejects below the minimum order amount", () => {
    const r = resolveCouponDiscount(base, { subtotal: 150, brandId: "tbc" });
    expect(r.ok).toBe(false);
  });

  it("rejects a brand mismatch", () => {
    const r = resolveCouponDiscount(
      { ...base, brandId: "alchemy-tails" },
      { subtotal: 300, brandId: "tbc" },
    );
    expect(r.ok).toBe(false);
  });

  it("rejects an expired coupon", () => {
    const r = resolveCouponDiscount(
      { ...base, expiresAt: "2000-01-01T00:00:00.000Z" },
      { subtotal: 300, brandId: "tbc" },
    );
    expect(r.ok).toBe(false);
  });
});

describe("getTiffinDishForDay", () => {
  it("returns the veg dish for a veg subscriber", () => {
    expect(getTiffinDishForDay("lunch", "veg", 0)).toBe("Rajma Chawal");
  });

  it("applies the non-veg override on the right day", () => {
    expect(getTiffinDishForDay("lunch", "non-veg", 0)).toBe("Chicken Curry");
  });

  it("falls back to the veg dish when there is no override", () => {
    expect(getTiffinDishForDay("lunch", "non-veg", 1)).toBe("Aloo Gobhi");
  });
});
