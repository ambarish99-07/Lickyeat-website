import { Router } from "express";
import {
  CreateComboRequestSchema,
  CreateMenuItemRequestSchema,
  UpdateComboRequestSchema,
  UpdateMenuItemRequestSchema,
} from "@lickyeat/shared-types";
import { asyncHandler, parse, param } from "../../lib/http.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import * as service from "./menu.service.js";

export const menuRouter: Router = Router();

// ---- public ----
menuRouter.get(
  "/addons",
  asyncHandler(async (_req, res) => {
    res.json({ addOns: await service.listAddOns() });
  }),
);

menuRouter.get(
  "/:brandId/items",
  asyncHandler(async (req, res) => {
    res.json({ items: await service.listMenuItems(param(req, "brandId")) });
  }),
);

menuRouter.get(
  "/:brandId/categories",
  asyncHandler(async (req, res) => {
    res.json({ categories: await service.listCategories(param(req, "brandId")) });
  }),
);

menuRouter.get(
  "/:brandId/combos",
  asyncHandler(async (req, res) => {
    res.json({ combos: await service.listCombos(param(req, "brandId")) });
  }),
);

menuRouter.get(
  "/items/:id",
  asyncHandler(async (req, res) => {
    res.json({ item: await service.getMenuItem(param(req, "id")) });
  }),
);

// ---- admin ----
menuRouter.post(
  "/items",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = parse(CreateMenuItemRequestSchema, req.body);
    res.status(201).json({ item: await service.createMenuItem(body) });
  }),
);

menuRouter.patch(
  "/items/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = parse(UpdateMenuItemRequestSchema, req.body);
    res.json({ item: await service.updateMenuItem(param(req, "id"), body) });
  }),
);

menuRouter.delete(
  "/items/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await service.deleteMenuItem(param(req, "id"));
    res.status(204).end();
  }),
);

menuRouter.post(
  "/combos",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = parse(CreateComboRequestSchema, req.body);
    res.status(201).json({ combo: await service.createCombo(body) });
  }),
);

menuRouter.patch(
  "/combos/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = parse(UpdateComboRequestSchema, req.body);
    res.json({ combo: await service.updateCombo(param(req, "id"), body) });
  }),
);
