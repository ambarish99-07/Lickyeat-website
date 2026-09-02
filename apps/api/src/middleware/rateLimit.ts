import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

// Only rate-limit in production — the demo/dev flows create many accounts.
const disabled = !env.isProd;

/** 5 signups / 15 min per IP (matches the reference project). */
export const signupRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: () => disabled,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "rate_limited", message: "Too many signups, try again later." } },
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: () => disabled,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "rate_limited", message: "Too many attempts, try again later." } },
});
