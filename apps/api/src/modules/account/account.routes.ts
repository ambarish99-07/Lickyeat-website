import { Router } from "express";
import { z } from "zod";
import { AddressSchema } from "@lickyeat/shared-types";
import { recommendItems } from "@lickyeat/pricing";
import { asyncHandler, parse } from "../../lib/http.js";
import { requireAuth } from "../../middleware/auth.js";
import { serialize } from "../../lib/serialize.js";
import { UserModel } from "../../db/models/User.model.js";
import { OrderModel } from "../../db/models/Order.model.js";
import { MenuItemModel } from "../../db/models/MenuItem.model.js";

export const accountRouter: Router = Router();

accountRouter.patch(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = parse(z.object({ name: z.string().min(1).max(120) }), req.body);
    const user = await UserModel.findByIdAndUpdate(req.user!.id, body, { new: true }).lean();
    res.json({ user: serialize(user) });
  }),
);

accountRouter.get(
  "/addresses",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.user!.id).lean();
    res.json({ addresses: serialize(user?.addresses ?? []) });
  }),
);

accountRouter.post(
  "/addresses",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = parse(AddressSchema, req.body);
    const user = await UserModel.findByIdAndUpdate(
      req.user!.id,
      { $push: { addresses: body } },
      { new: true },
    ).lean();
    res.status(201).json({ addresses: serialize(user?.addresses ?? []) });
  }),
);

accountRouter.get(
  "/recommendations",
  requireAuth,
  asyncHandler(async (req, res) => {
    const orders = await OrderModel.find({ userId: req.user!.id }).lean();
    const history = new Map<
      string,
      { itemId: string; name: string; brandId: string; quantity: number; lastOrderedAt: number }
    >();
    for (const o of orders) {
      const at = new Date(o.createdAt as unknown as string).getTime();
      for (const line of o.lines) {
        if (line.isCombo) continue;
        const key = String(line.refId);
        const prev = history.get(key);
        history.set(key, {
          itemId: key,
          name: line.name ?? "Item",
          brandId: o.brandId,
          quantity: (prev?.quantity ?? 0) + (line.quantity ?? 1),
          lastOrderedAt: Math.max(prev?.lastOrderedAt ?? 0, at),
        });
      }
    }
    const catalog = (await MenuItemModel.find({ isAvailable: true }).lean()).map((i) => ({
      itemId: String(i._id),
      name: i.name,
      brandId: i.brandId,
      category: i.category,
    }));
    const recs = recommendItems([...history.values()], catalog, { limit: 8 });
    res.json({ recommendations: recs });
  }),
);
