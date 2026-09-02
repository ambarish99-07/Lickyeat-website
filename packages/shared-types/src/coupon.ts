import { z } from "zod";
import { BrandIdSchema, ObjectIdSchema, RupeesSchema } from "./common.js";

export const CouponKindSchema = z.enum(["percent", "flat", "bogo"]);
export type CouponKind = z.infer<typeof CouponKindSchema>;

export const CouponSchema = z.object({
  id: ObjectIdSchema,
  code: z.string().min(3).max(32).toUpperCase(),
  kind: CouponKindSchema,
  /** percent: 0..100. flat: rupee amount. bogo: unused (0). */
  value: z.number().nonnegative(),
  /** cap on the discount for percent coupons; null = uncapped. */
  maxDiscount: RupeesSchema.nullable().default(null),
  minOrderAmount: RupeesSchema.default(0),
  /** null = valid for every brand. */
  brandId: BrandIdSchema.nullable().default(null),
  expiresAt: z.string().nullable().default(null),
  /** When true, a customer can use this code on only one order, ever. */
  oncePerCustomer: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Coupon = z.infer<typeof CouponSchema>;

/** A human sentence for a coupon, for the cart's "offers" list. */
export function couponSummary(
  c: Pick<Coupon, "kind" | "value" | "maxDiscount" | "minOrderAmount">,
): string {
  let off: string;
  if (c.kind === "bogo") off = "Buy 1 Get 1 — the cheapest eligible drink is free";
  else if (c.kind === "percent")
    off = `${c.value}% off${c.maxDiscount ? ` (up to ₹${c.maxDiscount})` : ""}`;
  else off = `₹${c.value} off`;
  return c.minOrderAmount > 0 ? `${off} on orders over ₹${c.minOrderAmount}` : off;
}

export const CreateCouponRequestSchema = CouponSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  value: true,
  maxDiscount: true,
  minOrderAmount: true,
  brandId: true,
  expiresAt: true,
  oncePerCustomer: true,
  isActive: true,
});
export type CreateCouponRequest = z.infer<typeof CreateCouponRequestSchema>;

export const ApplyCouponRequestSchema = z.object({
  code: z.string().min(3).max(32),
});
export type ApplyCouponRequest = z.infer<typeof ApplyCouponRequestSchema>;

export const ApplyCouponResponseSchema = z.object({
  code: z.string(),
  kind: CouponKindSchema,
  discountAmount: RupeesSchema,
  message: z.string(),
});
export type ApplyCouponResponse = z.infer<typeof ApplyCouponResponseSchema>;

export interface CouponLine {
  /** effective per-unit price (sale applied, add-ons included). */
  unitPrice: number;
  quantity: number;
  isCombo: boolean;
}

/** Buy-1-get-1: the cheapest single non-combo unit in the cart, given ≥ 2 eligible units. */
function cheapestEligibleUnitPrice(lines: CouponLine[]): number | null {
  const units: number[] = [];
  for (const l of lines) {
    if (l.isCombo) continue;
    for (let i = 0; i < l.quantity; i++) units.push(l.unitPrice);
  }
  if (units.length < 2) return null;
  return Math.min(...units);
}

/** Resolve a coupon against a cart. Pure — no DB, no user/expiry-outside checks beyond what's passed. */
export function resolveCouponDiscount(
  coupon: Pick<
    Coupon,
    "kind" | "value" | "maxDiscount" | "minOrderAmount" | "brandId" | "expiresAt" | "isActive"
  >,
  ctx: { subtotal: number; brandId: string; lines?: CouponLine[]; now?: Date },
): { ok: true; discountAmount: number } | { ok: false; reason: string } {
  const now = ctx.now ?? new Date();
  if (!coupon.isActive) return { ok: false, reason: "This coupon is no longer active." };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now.getTime())
    return { ok: false, reason: "This coupon has expired." };
  if (coupon.brandId && coupon.brandId !== ctx.brandId)
    return { ok: false, reason: "This coupon is not valid for this brand." };
  if (ctx.subtotal < coupon.minOrderAmount)
    return {
      ok: false,
      reason: `Add ₹${coupon.minOrderAmount - ctx.subtotal} more to use this coupon.`,
    };

  if (coupon.kind === "bogo") {
    const free = cheapestEligibleUnitPrice(ctx.lines ?? []);
    if (free == null)
      return { ok: false, reason: "Add 2 or more items (no combos) to use this Buy 1 Get 1 offer." };
    return { ok: true, discountAmount: Math.min(Math.round(free), ctx.subtotal) };
  }

  let discount =
    coupon.kind === "percent"
      ? Math.floor((ctx.subtotal * coupon.value) / 100)
      : Math.floor(coupon.value);
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, ctx.subtotal);
  return { ok: true, discountAmount: discount };
}
