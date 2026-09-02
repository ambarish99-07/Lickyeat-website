import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const disabled = env.isTest;

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
