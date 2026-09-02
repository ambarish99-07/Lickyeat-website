import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt.js";
import { forbidden, unauthorized } from "../lib/errors.js";
import { UserModel } from "../db/models/User.model.js";

export interface AuthedUser {
  id: string;
  role: "customer" | "admin";
  name: string;
  completedOrderCount: number;
  premiumTierOverride: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

/** Populates req.user when a valid token is present; never rejects. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    const user = await UserModel.findById(payload.sub).lean();
    if (user) {
      req.user = {
        id: String(user._id),
        role: user.role,
        name: user.name,
        completedOrderCount: user.completedOrderCount,
        premiumTierOverride: user.premiumTierOverride,
      };
    }
  } catch {
    /* ignore bad token for optional auth */
  }
  next();
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) throw unauthorized();
  const payload = verifyToken(token);
  const user = await UserModel.findById(payload.sub).lean();
  if (!user) throw unauthorized();
  req.user = {
    id: String(user._id),
    role: user.role,
    name: user.name,
    completedOrderCount: user.completedOrderCount,
    premiumTierOverride: user.premiumTierOverride,
  };
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw unauthorized();
  if (req.user.role !== "admin") throw forbidden("Admin access required");
  next();
}
