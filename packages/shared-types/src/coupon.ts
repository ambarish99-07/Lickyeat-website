import { z } from "zod";
import { BrandIdSchema, ObjectIdSchema, PercentSchema, RupeesSchema } from "./common.js";

export const CouponKindSchema = z.enum(["percent", "flat"]);
export type CouponKind = z.infer<typeof CouponKindSchema>;

export const CouponSchema = z.object({
  id: ObjectIdSchema,
  code: z.string().min(3).max(32).toUpperCase(),
  kind: CouponKindSchema,
  /** percent: 0..100. flat: rupee amount. */
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
  const off =
    c.kind === "percent"
      ? `${c.value}% off${c.maxDiscount ? ` (up to ₹${c.maxDiscount})` : ""}`
      : `₹${c.value} off`;
  return c.minOrderAmount > 0 ? `${off} on orders over ₹${c.minOrderAmount}` : off;
}

export const CreateCouponRequestSchema = CouponSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
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

/** Resolve a coupon against a subtotal + brand. Pure, reused by API + tests. */
export function resolveCouponDiscount(
  coupon: Pick<Coupon, "kind" | "value" | "maxDiscount" | "minOrderAmount" | "brandId" | "expiresAt" | "isActive">,
  ctx: { subtotal: number; brandId: string; now?: Date },
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

  let discount =
    coupon.kind === "percent"
      ? Math.floor((ctx.subtotal * coupon.value) / 100)
      : Math.floor(coupon.value);
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, ctx.subtotal);
  return { ok: true, discountAmount: discount };
}
