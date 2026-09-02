import { Router } from "express";
import { z } from "zod";
import { asyncHandler, parse } from "../../lib/http.js";
import { requireAuth } from "../../middleware/auth.js";
import * as service from "./premiumMembership.service.js";

export const premiumMembershipRouter: Router = Router();

premiumMembershipRouter.get(
  "/status",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ status: await service.getStatus(req.user!.id) });
  }),
);

premiumMembershipRouter.post(
  "/purchase",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.purchase(req.user!.id));
  }),
);

premiumMembershipRouter.post(
  "/verify",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = parse(
      z.object({
        membershipId: z.string(),
        razorpayOrderId: z.string(),
        razorpayPaymentId: z.string(),
        razorpaySignature: z.string(),
      }),
      req.body,
    );
    res.json({ membership: await service.verify(body) });
  }),
);
