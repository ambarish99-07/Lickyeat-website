import { z } from "zod";
import { BrandIdSchema, ObjectIdSchema } from "./common.js";

/** 0 = Sunday .. 6 = Saturday. */
export const ServiceHoursSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
  closed: z.boolean().default(false),
});
export type ServiceHours = z.infer<typeof ServiceHoursSchema>;

export const PlannedClosureSchema = z.object({
  id: ObjectIdSchema,
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().default(""),
});
export type PlannedClosure = z.infer<typeof PlannedClosureSchema>;

/** Shared shape for both the Lickyeat-wide singleton and per-brand settings. */
export const StoreSettingsCoreSchema = z.object({
  manualOpen: z.boolean().default(true),
  serviceHours: z.array(ServiceHoursSchema).default([]),
  plannedClosures: z.array(PlannedClosureSchema).default([]),
});

export const StoreSettingsSchema = StoreSettingsCoreSchema.extend({
  id: ObjectIdSchema,
  scope: z.literal("lickyeat"),
  updatedAt: z.string(),
});
export type StoreSettings = z.infer<typeof StoreSettingsSchema>;

export const BrandStoreSettingsSchema = StoreSettingsCoreSchema.extend({
  id: ObjectIdSchema,
  brandId: BrandIdSchema,
  updatedAt: z.string(),
});
export type BrandStoreSettings = z.infer<typeof BrandStoreSettingsSchema>;

export const StoreStatusSchema = z.object({
  open: z.boolean(),
  reason: z.string(),
  /** an upcoming planned closure the UI can pre-warn about. */
  upcomingClosure: PlannedClosureSchema.nullable(),
});
export type StoreStatus = z.infer<typeof StoreStatusSchema>;

export const UpdateStoreSettingsRequestSchema = StoreSettingsCoreSchema.partial();
export type UpdateStoreSettingsRequest = z.infer<typeof UpdateStoreSettingsRequestSchema>;
