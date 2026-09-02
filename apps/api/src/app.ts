import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import cors from "cors";
import { env } from "./config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
import { blogRouter } from "./modules/blog/blog.routes.js";

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.webOrigins.length ? env.webOrigins : true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  // Brand logos and other static assets. Served under /static so the web app can
  // reach them through its own /api proxy (<img src="/api/static/brands/…">).
  app.use(
    "/static",
    express.static(path.resolve(__dirname, "../public"), {
      maxAge: env.isProd ? "7d" : 0,
      fallthrough: false,
    }),
  );

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
  app.use("/blog", blogRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
