import { Router } from "express";
import { env } from "../../config/env.js";

export const paymentsRouter: Router = Router();

/** Lets the web app tell the customer whether online payment is live or simulated. */
paymentsRouter.get("/config", (_req, res) => {
  res.json({ razorpay: env.razorpay.configured });
});
