import { Router } from "express";
import { CreateCouponRequestSchema } from "@lickyeat/shared-types";
import { asyncHandler, parse, param } from "../../lib/http.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import * as service from "./coupons.service.js";

export const couponsRouter: Router = Router();

couponsRouter.get(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    res.json({ coupons: await service.listCoupons() });
  }),
);

couponsRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = parse(CreateCouponRequestSchema, req.body);
    res.status(201).json({ coupon: await service.createCoupon(body) });
  }),
);

couponsRouter.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = parse(CreateCouponRequestSchema.partial(), req.body);
    res.json({ coupon: await service.updateCoupon(param(req, "id"), body) });
  }),
);
