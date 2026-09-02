import type { NextFunction, Request, Response } from "express";
import { z, ZodError } from "zod";
import { badRequest } from "./errors.js";

/**
 * Express 5 forwards rejected promises to the error handler natively, but we
 * keep this wrapper for explicitness at call sites.
 */
export const asyncHandler =
  <T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/** Express 5 types route params as `string | string[]`; we always want the string. */
export function param(req: Request, name: string): string {
  const v = req.params[name];
  const s = Array.isArray(v) ? v[0] : v;
  if (typeof s !== "string" || s.length === 0) {
    throw badRequest(`Missing route parameter: ${name}`);
  }
  return s;
}

/** Read a query-string value as a single string (or undefined). */
export function queryStr(req: Request, name: string): string | undefined {
  const v = req.query[name];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

export function parse<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      throw badRequest("Validation failed", err.flatten());
    }
    throw err;
  }
}
