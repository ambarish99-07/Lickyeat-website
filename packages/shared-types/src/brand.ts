import { z } from "zod";
import { BrandIdSchema, ObjectIdSchema } from "./common.js";

export const BrandStatusSchema = z.enum(["live", "coming-soon"]);
export type BrandStatus = z.infer<typeof BrandStatusSchema>;

/**
 * Ordering model a brand uses. `catalog` = cart/checkout (TBC, Alchemy Tails, any
 * future catalog brand). `tiffin` = subscriptions + single-meal, structurally
 * separate order universe (GG Tiffin only).
 */
export const BrandOrderingModelSchema = z.enum(["catalog", "tiffin"]);
export type BrandOrderingModel = z.infer<typeof BrandOrderingModelSchema>;

export const BrandSchema = z.object({
  id: ObjectIdSchema,
  brandId: BrandIdSchema,
  name: z.string().min(1).max(120),
  tagline: z.string().max(200).default(""),
  description: z.string().max(2000).default(""),
  orderingModel: BrandOrderingModelSchema.default("catalog"),
  status: BrandStatusSchema.default("live"),
  logoUrl: z.string().url().or(z.string().startsWith("/")).nullable().default(null),
  heroImageUrl: z.string().url().or(z.string().startsWith("/")).nullable().default(null),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#e8552d"),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#f4a259"),
  sortOrder: z.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Brand = z.infer<typeof BrandSchema>;

export const CreateBrandRequestSchema = BrandSchema.pick({
  brandId: true,
  name: true,
  tagline: true,
  description: true,
  orderingModel: true,
  status: true,
  primaryColor: true,
  accentColor: true,
  sortOrder: true,
}).partial({
  tagline: true,
  description: true,
  orderingModel: true,
  status: true,
  primaryColor: true,
  accentColor: true,
  sortOrder: true,
});
export type CreateBrandRequest = z.infer<typeof CreateBrandRequestSchema>;

export const UpdateBrandRequestSchema = CreateBrandRequestSchema.partial().omit({
  brandId: true,
});
export type UpdateBrandRequest = z.infer<typeof UpdateBrandRequestSchema>;
