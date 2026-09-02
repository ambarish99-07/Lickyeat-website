import { Router } from "express";
import { z } from "zod";
import {
  CreateTiffinClosureRequestSchema,
  CreateTiffinSingleMealRequestSchema,
  CreateTiffinSubscriptionRequestSchema,
  GG_TIFFIN_BRAND_ID,
  getTiffinDishForDay,
} from "@lickyeat/shared-types";
import { asyncHandler, parse, param } from "../../lib/http.js";
import { optionalAuth, requireAdmin, requireAuth } from "../../middleware/auth.js";
import * as subs from "./tiffin.service.js";
import * as single from "./singleMeal.service.js";

export const tiffinRouter: Router = Router();

// ---- menu (public) ----
tiffinRouter.get(
  "/weekly-menu",
  asyncHandler(async (req, res) => {
    const diet = req.query.diet === "non-veg" ? "non-veg" : "veg";
    const meals = ["breakfast", "lunch", "dinner"] as const;
    const table = meals.map((meal) => ({
      meal,
      days: Array.from({ length: 7 }, (_, weekday) => getTiffinDishForDay(meal, diet, weekday)),
    }));
    res.json({ brandId: GG_TIFFIN_BRAND_ID, diet, table });
  }),
);

tiffinRouter.get(
  "/single-meal/menu",
  asyncHandler(async (req, res) => {
    const date =
      typeof req.query.date === "string"
        ? req.query.date
        : new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    res.json({ date, options: single.getSingleMealMenu(date) });
  }),
);

tiffinRouter.get(
  "/closures",
  asyncHandler(async (_req, res) => {
    res.json({ closures: await subs.listClosures() });
  }),
);

// ---- subscriptions (auth) ----
tiffinRouter.post(
  "/subscriptions",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = parse(CreateTiffinSubscriptionRequestSchema, req.body);
    res.status(201).json({ subscription: await subs.createSubscription(req.user!.id, body) });
  }),
);

tiffinRouter.get(
  "/subscriptions",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ subscriptions: await subs.listSubscriptions(req.user!.id) });
  }),
);

tiffinRouter.get(
  "/subscriptions/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ subscription: await subs.getSubscription(req.user!.id, param(req, "id")) });
  }),
);

tiffinRouter.post(
  "/subscriptions/:id/pause",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = parse(z.object({ pause: z.boolean() }), req.body);
    res.json({ subscription: await subs.pauseSubscription(req.user!.id, param(req, "id"), body.pause) });
  }),
);

tiffinRouter.post(
  "/subscriptions/:id/skip",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = parse(
      z.object({ date: z.string(), meal: z.string(), skip: z.boolean() }),
      req.body,
    );
    res.json({
      subscription: await subs.skipMeal(
        req.user!.id,
        param(req, "id"),
        body.date,
        body.meal,
        body.skip,
      ),
    });
  }),
);

tiffinRouter.post(
  "/subscriptions/:id/cancel",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ subscription: await subs.cancelSubscription(req.user!.id, param(req, "id")) });
  }),
);

// ---- single-meal orders ----
tiffinRouter.post(
  "/single-meal/orders",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const body = parse(CreateTiffinSingleMealRequestSchema, req.body);
    res.status(201).json({ order: await single.createSingleMealOrder(body, req.user) });
  }),
);

tiffinRouter.get(
  "/single-meal/orders/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ orders: await single.listMySingleMeals(req.user!.id) });
  }),
);

tiffinRouter.get(
  "/single-meal/track/:token",
  asyncHandler(async (req, res) => {
    res.json({ order: await single.trackSingleMeal(param(req, "token")) });
  }),
);

tiffinRouter.post(
  "/single-meal/track/:token/cancel",
  asyncHandler(async (req, res) => {
    res.json({ order: await single.cancelSingleMeal(param(req, "token")) });
  }),
);

// ---- admin ----
tiffinRouter.post(
  "/admin/closures",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = parse(CreateTiffinClosureRequestSchema, req.body);
    res.status(201).json(await subs.declareClosure(body));
  }),
);

tiffinRouter.post(
  "/admin/single-meal/:id/status",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = parse(z.object({ status: z.string() }), req.body);
    res.json({ order: await single.advanceSingleMealStatus(param(req, "id"), body.status) });
  }),
);
