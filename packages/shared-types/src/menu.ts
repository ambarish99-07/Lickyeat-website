import { z } from "zod";
import { BrandIdSchema, RupeesSchema } from "./common.js";

/**
 * Free text on purpose — a genuinely new kind of brand (biryani, momos, …) names
 * its own categories with zero code change. TBC/Alchemy Tails happen to use
 * "Signature Shakes" / "Cold Coffee" / "Mocktails"; nothing privileges them.
 */
export const MenuCategorySchema = z.string().min(1).max(60);

/** An item id is its slug (also the Mongo `_id`), e.g. "choco-crush". */
export const MenuItemIdSchema = z.string().min(1).max(80);

export const SugarLevelSchema = z.enum(["less", "regular", "extra"]);
export type SugarLevel = z.infer<typeof SugarLevelSchema>;
export const IceLevelSchema = z.enum(["less", "regular", "extra"]);
export type IceLevel = z.infer<typeof IceLevelSchema>;

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

/** One resolved, priced add-on as embedded on a MenuItem for display. */
export const MenuAddOnSchema = z.object({
  name: z.string(),
  price: RupeesSchema,
  isAvailable: z.boolean(),
});
export type MenuAddOn = z.infer<typeof MenuAddOnSchema>;

/**
 * The shared, admin-managed add-on price catalog — global across every brand
 * (a shake's "Whipped Cream" and a biryani's "Extra Raita" both live here).
 * Availability is global: out of whipped cream is true everywhere it's offered.
 */
export const MenuAddOnPriceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(60),
  price: RupeesSchema,
  isAvailable: z.boolean().default(true),
});
export type MenuAddOnPrice = z.infer<typeof MenuAddOnPriceSchema>;

export const MenuItemSchema = z.object({
  id: MenuItemIdSchema,
  brandId: BrandIdSchema,
  /** The fun, brand-owned name shown big — "Choco Crush". */
  signatureName: z.string().min(1).max(120),
  /** The plain "what is it" name shown small — "Rich Chocolate Shake". */
  commonName: z.string().min(1).max(120),
  description: z.string().max(1000).default(""),
  category: MenuCategorySchema,
  /** Default-size price (the strikethrough value when `salePercent` is set). */
  price: RupeesSchema,
  portionSize: z.string().max(40).default(""),
  imageUrl: z.string().nullable().default(null),
  /** Loose descriptors — "Chocolate Lover", "Fruity", "Minty". Display chips. */
  flavorBadges: z.array(z.string()).default([]),
  isPopular: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isStaffPick: z.boolean().optional(),
  /** When set, the real charged price is `price * (1 - salePercent/100)`. */
  salePercent: z.number().min(1).max(99).optional(),
  sizeVariants: z.array(SizeVariantSchema).default([]),
  /** Other item ids this pairs well with — powers "goes well with". */
  pairsWith: z.array(z.string()).default([]),
  /** False for an item with no sugar/ice concept (a tiffin, a biryani). */
  hasSugarIceCustomization: z.boolean().default(true),
  /** Names into the shared add-on catalog this item offers. */
  addOnNames: z.array(z.string()).default([]),
  /** Server-resolved from `addOnNames` on every read — never stored. */
  addOns: z.array(MenuAddOnSchema).optional(),
  isAvailable: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MenuItem = z.infer<typeof MenuItemSchema>;

export const CreateMenuItemRequestSchema = MenuItemSchema.omit({
  createdAt: true,
  updatedAt: true,
  addOns: true,
}).partial({
  id: true,
  description: true,
  portionSize: true,
  imageUrl: true,
  flavorBadges: true,
  salePercent: true,
  sizeVariants: true,
  pairsWith: true,
  hasSugarIceCustomization: true,
  addOnNames: true,
  isAvailable: true,
});
export type CreateMenuItemRequest = z.infer<typeof CreateMenuItemRequestSchema>;

export const UpdateMenuItemRequestSchema = CreateMenuItemRequestSchema.partial().omit({
  brandId: true,
});
export type UpdateMenuItemRequest = z.infer<typeof UpdateMenuItemRequestSchema>;

export const UpsertMenuAddOnPriceRequestSchema = z.object({
  name: z.string().min(1).max(60),
  price: RupeesSchema,
  isAvailable: z.boolean().default(true),
});
export type UpsertMenuAddOnPriceRequest = z.infer<typeof UpsertMenuAddOnPriceRequestSchema>;

// ---------------------------------------------------------------------------
// Combos — curated duos and "choose N". Price is always live: `discountPercent`
// (or the global 15% default) off the constituents' current base prices.
// ---------------------------------------------------------------------------

export const ComboTypeSchema = z.enum(["curated", "choose-n"]);
export type ComboType = z.infer<typeof ComboTypeSchema>;

export const ComboSchema = z.object({
  id: z.string().min(1).max(80),
  brandId: BrandIdSchema,
  name: z.string().min(1).max(120),
  description: z.string().max(1000).default(""),
  type: ComboTypeSchema,
  imageUrl: z.string().nullable().default(null),
  /** curated: the fixed set of item ids (>= 2). */
  itemIds: z.array(z.string()).default([]),
  /** choose-n: how many items the customer picks, and from which pool. */
  chooseCount: z.number().int().min(2).max(12).nullable().default(null),
  eligibleItemIds: z.array(z.string()).default([]),
  /** Admin override; unset ⇒ the global 15% default. */
  discountPercent: z.number().min(1).max(99).nullable().default(null),
  isAvailable: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Combo = z.infer<typeof ComboSchema>;

export const CreateComboRequestSchema = ComboSchema.omit({
  createdAt: true,
  updatedAt: true,
}).partial({
  id: true,
  description: true,
  imageUrl: true,
  itemIds: true,
  chooseCount: true,
  eligibleItemIds: true,
  discountPercent: true,
  isAvailable: true,
});
export type CreateComboRequest = z.infer<typeof CreateComboRequestSchema>;

export const UpdateComboRequestSchema = CreateComboRequestSchema.partial().omit({
  brandId: true,
});
export type UpdateComboRequest = z.infer<typeof UpdateComboRequestSchema>;

// ---------------------------------------------------------------------------
// Category display labels — slug/free-text → human label. Falls back to
// title-casing anything not listed, so a new brand's category still reads well.
// ---------------------------------------------------------------------------
const CATEGORY_LABELS: Record<string, string> = {
  "signature-shakes": "Signature Shakes",
  "cold-coffee": "Cold Coffee",
  mocktails: "Mocktails",
  "chicken-biryani": "Chicken Biryani",
  "veg-paneer-biryani": "Veg & Paneer Biryani",
};

export function categoryLabel(category: string): string {
  return (
    CATEGORY_LABELS[category] ??
    category.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
