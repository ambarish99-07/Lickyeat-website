import type { CreateCouponRequest } from "@lickyeat/shared-types";
import { couponSummary, resolveCouponDiscount } from "@lickyeat/shared-types";
import { CouponModel } from "../../db/models/Coupon.model.js";
import { OrderModel } from "../../db/models/Order.model.js";
import { badRequest, notFound } from "../../lib/errors.js";
import { serialize } from "../../lib/serialize.js";

export interface ResolvedCoupon {
  code: string | null;
  discountAmount: number;
  message: string;
}

/**
 * Resolve a coupon code against a cart. Returns discountAmount 0 (not an error)
 * for a soft failure so the preview endpoint can show a message inline; the
 * order-creation path treats a hard failure as fatal (see throwOnInvalid).
 * `userId` enables the once-per-customer check.
 */
export async function resolveCouponForCart(
  code: string,
  ctx: { subtotal: number; brandId: string; userId?: string | null },
  opts: { throwOnInvalid?: boolean } = {},
): Promise<ResolvedCoupon> {
  const coupon = await CouponModel.findOne({ code: code.toUpperCase() }).lean();
  if (!coupon) {
    if (opts.throwOnInvalid) throw badRequest("That coupon code is not valid.");
    return { code: null, discountAmount: 0, message: "That coupon code is not valid." };
  }

  const result = resolveCouponDiscount(
    {
      kind: coupon.kind,
      value: coupon.value,
      maxDiscount: coupon.maxDiscount ?? null,
      minOrderAmount: coupon.minOrderAmount ?? 0,
      brandId: coupon.brandId ?? null,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
      isActive: coupon.isActive ?? true,
    },
    ctx,
  );

  if (!result.ok) {
    if (opts.throwOnInvalid) throw badRequest(result.reason);
    return { code: null, discountAmount: 0, message: result.reason };
  }

  if (coupon.oncePerCustomer && ctx.userId) {
    const alreadyUsed = await OrderModel.exists({
      userId: ctx.userId,
      couponCode: coupon.code,
      status: { $ne: "cancelled" },
    });
    if (alreadyUsed) {
      const reason = `${coupon.code} can only be used once per account.`;
      if (opts.throwOnInvalid) throw badRequest(reason);
      return { code: null, discountAmount: 0, message: reason };
    }
  }

  return {
    code: coupon.code,
    discountAmount: result.discountAmount,
    message: `${coupon.code} applied — you save ₹${result.discountAmount}.`,
  };
}

export async function listCoupons() {
  const coupons = await CouponModel.find({}).sort({ createdAt: -1 }).lean();
  return coupons.map((c) => serialize(c));
}

/** Public — the active offers shown in the cart. */
export async function listAvailableCoupons() {
  const now = new Date();
  const coupons = await CouponModel.find({
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .sort({ minOrderAmount: 1 })
    .lean();
  return coupons.map((c) => ({
    code: c.code,
    kind: c.kind,
    value: c.value,
    maxDiscount: c.maxDiscount ?? null,
    minOrderAmount: c.minOrderAmount ?? 0,
    brandId: c.brandId ?? null,
    oncePerCustomer: c.oncePerCustomer ?? false,
    summary: couponSummary({
      kind: c.kind,
      value: c.value,
      maxDiscount: c.maxDiscount ?? null,
      minOrderAmount: c.minOrderAmount ?? 0,
    }),
  }));
}

export async function createCoupon(input: CreateCouponRequest) {
  const coupon = await CouponModel.create({ ...input, code: input.code.toUpperCase() });
  return serialize(coupon.toObject());
}

export async function updateCoupon(id: string, input: Partial<CreateCouponRequest>) {
  const coupon = await CouponModel.findByIdAndUpdate(id, input, { new: true }).lean();
  if (!coupon) throw notFound("Coupon not found");
  return serialize(coupon);
}
