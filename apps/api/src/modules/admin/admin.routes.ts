import { Router } from "express";
import { asyncHandler } from "../../lib/http.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { serialize } from "../../lib/serialize.js";
import { OrderModel } from "../../db/models/Order.model.js";
import { UserModel } from "../../db/models/User.model.js";
import { TiffinSubscriptionModel } from "../../db/models/TiffinSubscription.model.js";
import { TiffinSingleMealOrderModel } from "../../db/models/TiffinSingleMealOrder.model.js";

export const adminRouter: Router = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const [orderCount, revenueAgg, customerCount, subCount, activeOrders] = await Promise.all([
      OrderModel.countDocuments({}),
      OrderModel.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$payment.amount" } } },
      ]),
      UserModel.countDocuments({ role: "customer" }),
      TiffinSubscriptionModel.countDocuments({ status: "active" }),
      OrderModel.countDocuments({ status: { $in: ["received", "preparing", "out-for-delivery"] } }),
    ]);
    const byBrand = await OrderModel.aggregate([
      { $group: { _id: "$brandId", orders: { $sum: 1 }, revenue: { $sum: "$payment.amount" } } },
    ]);
    res.json({
      dashboard: {
        totalOrders: orderCount,
        totalRevenue: revenueAgg[0]?.total ?? 0,
        customers: customerCount,
        activeSubscriptions: subCount,
        activeOrders,
        byBrand,
      },
    });
  }),
);

adminRouter.get(
  "/customers",
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const filter = q
      ? {
          role: "customer",
          $or: [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
            { phone: { $regex: q } },
          ],
        }
      : { role: "customer" };
    const users = await UserModel.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ customers: users.map((u) => serialize(u)) });
  }),
);

adminRouter.get(
  "/tiffin/subscriptions",
  asyncHandler(async (_req, res) => {
    const subs = await TiffinSubscriptionModel.find({}).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ subscriptions: subs.map((s) => serialize(s)) });
  }),
);

adminRouter.get(
  "/tiffin/single-meal/orders",
  asyncHandler(async (_req, res) => {
    const orders = await TiffinSingleMealOrderModel.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json({ orders: orders.map((o) => serialize(o)) });
  }),
);
