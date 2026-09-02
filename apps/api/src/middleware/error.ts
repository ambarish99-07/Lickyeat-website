import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/errors.js";
import { env } from "../config/env.js";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: "not_found", message: "Route not found" } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err instanceof ZodError) {
    return res
      .status(400)
      .json({ error: { code: "bad_request", message: "Validation failed", details: err.flatten() } });
  }
  if (err && typeof err === "object" && (err as { code?: number }).code === 11000) {
    return res
      .status(409)
      .json({ error: { code: "conflict", message: "That value is already in use" } });
  }

  // eslint-disable-next-line no-console
  console.error("[error]", err);
  res.status(500).json({
    error: {
      code: "internal",
      message: env.isProd ? "Something went wrong" : String((err as Error)?.message ?? err),
    },
  });
}
