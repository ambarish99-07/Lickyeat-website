import { z } from "zod";

/**
 * A MongoDB ObjectId rendered as a 24-char hex string. Every document id crossing
 * the API boundary is a string, never a raw ObjectId.
 */
export const ObjectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "must be a 24-character hex ObjectId string");

/** Rupee amount. Always a non-negative integer number of paise-free rupees. */
export const RupeesSchema = z.number().int().nonnegative();

/** Percentage 0..100. */
export const PercentSchema = z.number().min(0).max(100);

export const IsoDateStringSchema = z.string().datetime({ offset: true });

/**
 * The three brands live under one umbrella. `brandId` is free-form on purpose so a
 * brand created five minutes ago behaves exactly like a founding one — nothing in
 * the catalog/pricing code may hardcode this set. `cross-brand` is the reserved id
 * for the one combo that mixes items from any live brand.
 */
export const BrandIdSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9-]+$/, "lowercase kebab-case only");

export const CROSS_BRAND_ID = "cross-brand" as const;

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
  });

/** Standard API error envelope. */
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
