import { Router } from "express";
import { UpdateStoreSettingsRequestSchema } from "@lickyeat/shared-types";
import { asyncHandler, parse, param } from "../../lib/http.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { serialize } from "../../lib/serialize.js";
import * as service from "./storeSettings.service.js";

export const storeSettingsRouter: Router = Router();

storeSettingsRouter.get(
  "/lickyeat",
  asyncHandler(async (_req, res) => {
    const doc = await service.getOrCreateLickyeatSettings();
    res.json({ settings: serialize(doc.toObject()) });
  }),
);

storeSettingsRouter.patch(
  "/lickyeat",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = parse(UpdateStoreSettingsRequestSchema, req.body);
    res.json({ settings: await service.updateLickyeatSettings(body) });
  }),
);

storeSettingsRouter.get(
  "/brand/:brandId",
  asyncHandler(async (req, res) => {
    const doc = await service.getOrCreateBrandStoreSettings(param(req, "brandId"));
    res.json({ settings: serialize(doc.toObject()) });
  }),
);

storeSettingsRouter.patch(
  "/brand/:brandId",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = parse(UpdateStoreSettingsRequestSchema, req.body);
    res.json({ settings: await service.updateBrandStoreSettings(param(req, "brandId"), body) });
  }),
);
