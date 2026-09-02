import { Router } from "express";
import { z } from "zod";
import { AddressSchema, CreateOrderLineSchema } from "@lickyeat/shared-types";
import { asyncHandler, parse } from "../../lib/http.js";
import { optionalAuth } from "../../middleware/auth.js";
import { resolveCart, price } from "./priceResolver.js";
import { buildLoyaltyState } from "./loyalty.js";
import { resolveCouponForCart } from "../coupons/coupons.service.js";

const PreviewSchema = z.object({
  lines: z.array(CreateOrderLineSchema).min(1),
  couponCode: z.string().max(32).nullable().default(null),
  address: AddressSchema.partial().optional(),
});

export const pricingRouter: Router = Router();

pricingRouter.post(
  "/preview",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const body = parse(PreviewSchema, req.body);
    const cart = await resolveCart(body.lines);
    const loyalty = await buildLoyaltyState(
      req.user,
      body.address ? (body.address as never) : null,
    );

    const subtotalForCoupon = cart.pricingLines.reduce(
      (s, l) => s + (l.unitBasePrice + l.unitAddOnsPrice) * l.quantity,
      0,
    );
    const coupon = body.couponCode
      ? await resolveCouponForCart(body.couponCode, {
          subtotal: subtotalForCoupon,
          brandId: cart.brandId,
          userId: req.user?.id ?? null,
        })
      : { discountAmount: 0, code: null as string | null, message: "" };

    const result = price({
      lines: cart.pricingLines,
      loyalty,
      couponDiscountAmount: coupon.discountAmount,
      couponCode: coupon.code,
    });

    res.json({ pricing: result, couponMessage: coupon.message, brandId: cart.brandId });
  }),
);
