import { Router } from "express";
import {
  CreateBrandRequestSchema,
  UpdateBrandRequestSchema,
} from "@lickyeat/shared-types";
import { asyncHandler, parse, param } from "../../lib/http.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { getBrandStoreStatus } from "../storeSettings/storeSettings.service.js";
import * as service from "./brands.service.js";

export const brandsRouter: Router = Router();

brandsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = req.query.status;
    res.json({
      brands: await service.listBrands(
        status === "live" || status === "coming-soon" ? { status } : {},
      ),
    });
  }),
);

brandsRouter.get(
  "/coming-soon",
  asyncHandler(async (_req, res) => {
    res.json({ brands: await service.listBrands({ status: "coming-soon" }) });
  }),
);

brandsRouter.get(
  "/:brandId",
  asyncHandler(async (req, res) => {
    res.json({ brand: await service.getBrand(param(req, "brandId")) });
  }),
);

brandsRouter.get(
  "/:brandId/status",
  asyncHandler(async (req, res) => {
    res.json({ status: await getBrandStoreStatus(param(req, "brandId")) });
  }),
);

brandsRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = parse(CreateBrandRequestSchema, req.body);
    res.status(201).json({ brand: await service.createBrand(body) });
  }),
);

brandsRouter.patch(
  "/:brandId",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = parse(UpdateBrandRequestSchema, req.body);
    res.json({ brand: await service.updateBrand(param(req, "brandId"), body) });
  }),
);
