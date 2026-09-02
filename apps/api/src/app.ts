import express, { type Express } from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { brandsRouter } from "./modules/brands/brands.routes.js";
import { menuRouter } from "./modules/menu/menu.routes.js";
import { pricingRouter } from "./modules/pricing/pricing.routes.js";
import { couponsRouter } from "./modules/coupons/coupons.routes.js";
import { ordersRouter } from "./modules/orders/orders.routes.js";
import { tiffinRouter } from "./modules/tiffin/tiffin.routes.js";
import { premiumMembershipRouter } from "./modules/premiumMembership/premiumMembership.routes.js";
import { storeSettingsRouter } from "./modules/storeSettings/storeSettings.routes.js";
import { accountRouter } from "./modules/account/account.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.webOrigins.length ? env.webOrigins : true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, env: env.nodeEnv });
  });

  app.use("/auth", authRouter);
  app.use("/brands", brandsRouter);
  app.use("/menu", menuRouter);
  app.use("/pricing", pricingRouter);
  app.use("/coupons", couponsRouter);
  app.use("/orders", ordersRouter);
  app.use("/tiffin", tiffinRouter);
  app.use("/premium-membership", premiumMembershipRouter);
  app.use("/store-settings", storeSettingsRouter);
  app.use("/account", accountRouter);
  app.use("/admin", adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
