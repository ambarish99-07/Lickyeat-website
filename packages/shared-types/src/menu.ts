import { z } from "zod";
import { BrandIdSchema, ObjectIdSchema, PercentSchema, RupeesSchema } from "./common.js";

/** Free text on purpose — a brand-new brand invents its own categories. */
export const MenuCategorySchema = z.string().min(1).max(60);

export const SugarLevelSchema = z.enum(["none", "less", "normal", "extra"]);
export const IceLevelSchema = z.enum(["none", "less", "normal", "extra"]);

/**
 * An extra size beyond the item's default (its own `price`). Priced directly by
 * the admin, never a multiplier. `isAvailable` is a per-size out-of-stock toggle.
 */
export const SizeVariantSchema = z.object({
  label: z.string().min(1).max(40),
  price: RupeesSchema,
  isAvailable: z.boolean().default(true),
});
export type SizeVariant = z.infer<typeof SizeVariantSchema>;

/**
 * Shared, named add-on catalog entry. Availability is GLOBAL (running out of
 * whipped cream is true everywhere it is offered), not per-item.
 */
export const MenuAddOnPriceSchema = z.object({
  id: ObjectIdSchema,
  name: z.string().min(1).max(60),
  price: RupeesSchema,
  isAvailable: z.boolean().default(true),
});
export type MenuAddOnPrice = z.infer<typeof MenuAddOnPriceSchema>;

export const MenuItemSchema = z.object({
  id: ObjectIdSchema,
  brandId: BrandIdSchema,
  name: z.string().min(1).max(120),
  description: z.string().max(1000).default(""),
  category: MenuCategorySchema,
  /** Default-size price. */
  price: RupeesSchema,
  portionSize: z.string().max(40).default(""),
  imageUrl: z.string().url().or(z.string().startsWith("/")).nullable().default(null),
  /** Per-item markdown, stacks with cart-level discounts. */
  salePercent: PercentSchema.default(0),
  sizeVariants: z.array(SizeVariantSchema).default([]),
  /** Names into the shared add-on catalog that this item allows. */
  allowedAddOns: z.array(z.string()).default([]),
  supportsSugar: z.boolean().default(false),
  supportsIce: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MenuItem = z.infer<typeof MenuItemSchema>;

export const CreateMenuItemRequestSchema = MenuItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  description: true,
  portionSize: true,
  imageUrl: true,
  salePercent: true,
  sizeVariants: true,
  allowedAddOns: true,
  supportsSugar: true,
  supportsIce: true,
  isAvailable: true,
  tags: true,
});
export type CreateMenuItemRequest = z.infer<typeof CreateMenuItemRequestSchema>;

export const UpdateMenuItemRequestSchema = CreateMenuItemRequestSchema.partial().omit({
  brandId: true,
});
export type UpdateMenuItemRequest = z.infer<typeof UpdateMenuItemRequestSchema>;

// ---------------------------------------------------------------------------
// Combos
// ---------------------------------------------------------------------------

// COMBO_DISCOUNT_PERCENT lives in ./pricing.ts (single source of truth).

export const ComboTypeSchema = z.enum(["curated", "choose-your-own"]);
export type ComboType = z.infer<typeof ComboTypeSchema>;

export const ComboSchema = z.object({
  id: ObjectIdSchema,
  brandId: BrandIdSchema,
  name: z.string().min(1).max(120),
  description: z.string().max(1000).default(""),
  type: ComboTypeSchema,
  imageUrl: z.string().url().or(z.string().startsWith("/")).nullable().default(null),
  /** curated: the fixed set of item ids. */
  itemIds: z.array(ObjectIdSchema).default([]),
  /** choose-your-own: how many items the customer picks, and from which pool. */
  chooseCount: z.number().int().min(2).max(12).nullable().default(null),
  eligibleItemIds: z.array(ObjectIdSchema).default([]),
  isAvailable: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Combo = z.infer<typeof ComboSchema>;

export const CreateComboRequestSchema = ComboSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  description: true,
  imageUrl: true,
  itemIds: true,
  chooseCount: true,
  eligibleItemIds: true,
  isAvailable: true,
});
export type CreateComboRequest = z.infer<typeof CreateComboRequestSchema>;

export const UpdateComboRequestSchema = CreateComboRequestSchema.partial().omit({
  brandId: true,
});
export type UpdateComboRequest = z.infer<typeof UpdateComboRequestSchema>;
