import { Router } from "express";
import { LoginRequestSchema, SignupRequestSchema } from "@lickyeat/shared-types";
import { asyncHandler, parse } from "../../lib/http.js";
import { requireAuth } from "../../middleware/auth.js";
import { loginRateLimiter, signupRateLimiter } from "../../middleware/rateLimit.js";
import * as service from "./auth.service.js";

export const authRouter: Router = Router();

authRouter.post(
  "/signup",
  signupRateLimiter,
  asyncHandler(async (req, res) => {
    const body = parse(SignupRequestSchema, req.body);
    res.status(201).json(await service.signup(body));
  }),
);

authRouter.post(
  "/login",
  loginRateLimiter,
  asyncHandler(async (req, res) => {
    const body = parse(LoginRequestSchema, req.body);
    res.json(await service.login(body));
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: await service.getMe(req.user!.id) });
  }),
);
