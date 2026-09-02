import { connectDb, disconnectDb } from "./db/connect.js";
import { BrandModel } from "./db/models/Brand.model.js";
import { MenuAddOnModel } from "./db/models/MenuAddOn.model.js";
import { MenuItemModel } from "./db/models/MenuItem.model.js";
import { ComboModel } from "./db/models/Combo.model.js";
import { CouponModel } from "./db/models/Coupon.model.js";
import { StoreSettingsModel } from "./db/models/StoreSettings.model.js";

async function seed() {
  await connectDb();
  // eslint-disable-next-line no-console
  const log = (...a: unknown[]) => console.log("[seed]", ...a);

  await Promise.all([
    BrandModel.deleteMany({}),
    MenuAddOnModel.deleteMany({}),
    MenuItemModel.deleteMany({}),
    ComboModel.deleteMany({}),
    CouponModel.deleteMany({}),
    StoreSettingsModel.deleteMany({}),
  ]);

  await StoreSettingsModel.create({ scope: "lickyeat", manualOpen: true });

  await BrandModel.create([
    {
      brandId: "tbc",
      name: "The Blenders Club",
      tagline: "Shakes & mocktails, blended to order.",
      description:
        "A cloud kitchen built on thick shakes, cold coffees and fresh mocktails — quick delivery across Patna.",
      orderingModel: "catalog",
      status: "live",
      primaryColor: "#7b2ff7",
      accentColor: "#f357a8",
      sortOrder: 1,
    },
    {
      brandId: "alchemy-tails",
      name: "The Alchemy Tails",
      tagline: "Cocktail-style mocktails, zero proof.",
      description:
        "Craft mocktails with the drama of a cocktail bar — layered, garnished, and alcohol-free.",
      orderingModel: "catalog",
      status: "live",
      primaryColor: "#0f766e",
      accentColor: "#f4a259",
      sortOrder: 2,
    },
    {
      brandId: "gg-tiffin",
      name: "GG Tiffin Service",
      tagline: "Home-style meals, delivered daily.",
      description:
        "Ghar jaisa khana — weekly and monthly tiffin subscriptions, or order a single meal whenever you like.",
      orderingModel: "tiffin",
      status: "live",
      primaryColor: "#b45309",
      accentColor: "#65a30d",
      sortOrder: 3,
    },
    {
      brandId: "the-biryani-lane",
      name: "The Biryani Lane",
      tagline: "Dum biryani, coming soon.",
      description: "Slow-cooked dum biryani and kebabs. Launching in Patna shortly.",
      orderingModel: "catalog",
      status: "coming-soon",
      primaryColor: "#9f1239",
      accentColor: "#f59e0b",
      sortOrder: 4,
    },
  ]);
  log("brands created");

  await MenuAddOnModel.create([
    { name: "Whipped Cream", price: 25 },
    { name: "Extra Scoop Ice Cream", price: 40 },
    { name: "Chocolate Sauce", price: 15 },
    { name: "Oreo Crumble", price: 20 },
    { name: "Dry Fruits", price: 35 },
    { name: "Extra Shot Espresso", price: 30 },
    { name: "Mint Sprig", price: 10 },
    { name: "Chia Seeds", price: 20 },
  ]);
  log("add-on catalog created");

  const tbcItems = await MenuItemModel.create([
    {
      brandId: "tbc",
      name: "Classic Cold Coffee",
      description: "Blended cold coffee with milk and a hint of cocoa.",
      category: "Cold Coffee",
      price: 120,
      portionSize: "300 ml",
      supportsSugar: true,
      supportsIce: true,
      allowedAddOns: ["Whipped Cream", "Extra Shot Espresso", "Chocolate Sauce", "Oreo Crumble"],
      sizeVariants: [{ label: "Large (450 ml)", price: 160, isAvailable: true }],
      tags: ["bestseller", "drink"],
    },
    {
      brandId: "tbc",
      name: "Belgian Chocolate Shake",
      description: "Thick chocolate shake with real Belgian chocolate.",
      category: "Shakes",
      price: 180,
      portionSize: "400 ml",
      allowedAddOns: ["Whipped Cream", "Extra Scoop Ice Cream", "Dry Fruits", "Oreo Crumble"],
      salePercent: 10,
      tags: ["drink", "shake"],
    },
    {
      brandId: "tbc",
      name: "Strawberry Cream Shake",
      description: "Fresh strawberry shake with cream.",
      category: "Shakes",
      price: 170,
      portionSize: "400 ml",
      allowedAddOns: ["Whipped Cream", "Extra Scoop Ice Cream"],
      tags: ["drink", "shake"],
    },
    {
      brandId: "tbc",
      name: "Hazelnut Frappe",
      description: "Iced hazelnut coffee frappe, whipped light.",
      category: "Cold Coffee",
      price: 150,
      portionSize: "350 ml",
      supportsSugar: true,
      supportsIce: true,
      allowedAddOns: ["Whipped Cream", "Extra Shot Espresso"],
      tags: ["drink"],
    },
    {
      brandId: "tbc",
      name: "Virgin Mojito",
      description: "Lime, mint and soda over crushed ice.",
      category: "Mocktails",
      price: 110,
      portionSize: "300 ml",
      supportsIce: true,
      allowedAddOns: ["Mint Sprig", "Chia Seeds"],
      tags: ["drink", "mocktail"],
    },
  ]);

  const alchemyItems = await MenuItemModel.create([
    {
      brandId: "alchemy-tails",
      name: "Smoked Blue Lagoon",
      description: "Blue curaçao-style syrup, citrus, smoked with rosemary.",
      category: "Signature Mocktails",
      price: 190,
      portionSize: "250 ml",
      allowedAddOns: ["Mint Sprig", "Chia Seeds"],
      tags: ["drink", "mocktail", "bestseller"],
    },
    {
      brandId: "alchemy-tails",
      name: "Passionfruit Spritz",
      description: "Passionfruit, elderflower, sparkling water.",
      category: "Spritz",
      price: 180,
      portionSize: "250 ml",
      allowedAddOns: ["Mint Sprig"],
      tags: ["drink", "mocktail"],
    },
    {
      brandId: "alchemy-tails",
      name: "Spiced Tamarind Cooler",
      description: "Tamarind, jaggery, roasted cumin, chilli rim.",
      category: "Coolers",
      price: 150,
      portionSize: "300 ml",
      salePercent: 15,
      tags: ["drink", "mocktail", "cooler"],
    },
    {
      brandId: "alchemy-tails",
      name: "Rose Litchi Fizz",
      description: "Rose, litchi, lime and soda.",
      category: "Spritz",
      price: 175,
      portionSize: "250 ml",
      tags: ["drink", "mocktail"],
    },
  ]);
  log(`menu items created: tbc=${tbcItems.length}, alchemy=${alchemyItems.length}`);

  await ComboModel.create([
    {
      brandId: "tbc",
      name: "Coffee + Shake Combo",
      description: "One cold coffee and one shake, 15% off.",
      type: "curated",
      itemIds: [tbcItems[0]!._id, tbcItems[1]!._id],
      isAvailable: true,
    },
    {
      brandId: "tbc",
      name: "Pick Any 3 Drinks",
      description: "Choose any 3 TBC drinks, 15% off the total.",
      type: "choose-your-own",
      chooseCount: 3,
      eligibleItemIds: tbcItems.map((i) => i._id),
      isAvailable: true,
    },
    {
      brandId: "cross-brand",
      name: "TBC × Alchemy Duo",
      description: "One TBC shake and one Alchemy signature mocktail.",
      type: "choose-your-own",
      chooseCount: 2,
      eligibleItemIds: [tbcItems[1]!._id, tbcItems[2]!._id, alchemyItems[0]!._id, alchemyItems[1]!._id],
      isAvailable: true,
    },
  ]);
  log("combos created");

  await CouponModel.create([
    {
      code: "WELCOME50",
      kind: "flat",
      value: 50,
      minOrderAmount: 250,
      brandId: null,
      isActive: true,
    },
    {
      code: "TBC20",
      kind: "percent",
      value: 20,
      maxDiscount: 80,
      minOrderAmount: 200,
      brandId: "tbc",
      isActive: true,
    },
  ]);
  log("coupons created");

  log("done. Run `pnpm promote-admin <email>` after signing up to create an admin.");
  await disconnectDb();
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[seed] failed", err);
  process.exit(1);
});
