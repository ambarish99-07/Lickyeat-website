import { Router } from "express";
import { z } from "zod";
import {
  CancelOrderRequestSchema,
  CreateOrderRequestSchema,
  OrderStatusSchema,
  VerifyPaymentRequestSchema,
} from "@lickyeat/shared-types";
import { asyncHandler, parse, param } from "../../lib/http.js";
import { optionalAuth, requireAdmin, requireAuth } from "../../middleware/auth.js";
import * as service from "./orders.service.js";

export const ordersRouter: Router = Router();

ordersRouter.post(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const body = parse(CreateOrderRequestSchema, req.body);
    res.status(201).json(await service.createOrder(body, req.user));
  }),
);

ordersRouter.post(
  "/verify-payment",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const body = parse(VerifyPaymentRequestSchema, req.body);
    res.json({
      order: await service.verifyPayment({
        orderId: body.orderId,
        razorpayOrderId: body.razorpayOrderId,
        razorpayPaymentId: body.razorpayPaymentId,
        razorpaySignature: body.razorpaySignature,
      }),
    });
  }),
);

ordersRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ orders: await service.listMyOrders(req.user!.id) });
  }),
);

ordersRouter.get(
  "/:id/reorder",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ reorder: await service.buildReorder(param(req, "id"), req.user!) });
  }),
);

// accessToken IS the authorization — no auth check (§3.4).
ordersRouter.get(
  "/track/:token",
  asyncHandler(async (req, res) => {
    res.json({ order: await service.getOrderByAccessToken(param(req, "token")) });
  }),
);

ordersRouter.post(
  "/track/:token/cancel",
  asyncHandler(async (req, res) => {
    const body = parse(CancelOrderRequestSchema, req.body);
    res.json({ order: await service.cancelOrder(param(req, "token"), body) });
  }),
);

// ---- admin ----
ordersRouter.get(
  "/admin/all",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({
      orders: await service.listAllOrders({
        brandId: typeof req.query.brandId === "string" ? req.query.brandId : undefined,
        status: typeof req.query.status === "string" ? req.query.status : undefined,
      }),
    });
  }),
);

ordersRouter.post(
  "/admin/:id/status",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = parse(z.object({ status: OrderStatusSchema }), req.body);
    res.json({ order: await service.advanceOrderStatus(param(req, "id"), body.status) });
  }),
);
