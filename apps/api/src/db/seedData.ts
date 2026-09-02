import bcrypt from "bcryptjs";
import { BrandModel } from "./models/Brand.model.js";
import { MenuAddOnModel } from "./models/MenuAddOn.model.js";
import { MenuItemModel } from "./models/MenuItem.model.js";
import { ComboModel } from "./models/Combo.model.js";
import { CouponModel } from "./models/Coupon.model.js";
import { StoreSettingsModel } from "./models/StoreSettings.model.js";
import { UserModel } from "./models/User.model.js";

/** Demo admin login for local dev: admin@lickyeat.com / Lickyeat@123 */
export async function ensureDemoAdmin() {
  const existing = await UserModel.findOne({ email: "admin@lickyeat.com" });
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
    }
    return;
  }
  await UserModel.create({
    name: "Lickyeat Admin",
    email: "admin@lickyeat.com",
    phone: null,
    passwordHash: await bcrypt.hash("Lickyeat@123", 10),
    role: "admin",
  });
}

/**
 * Populate a fresh database with demo data. Reused by both the standalone
 * `pnpm seed` script and the optional SEED_ON_BOOT bootstrap (handy with the
 * in-memory dev Mongo, where a separate seed process can't share data).
 *
 * Everything here is data, not code — brand ids, category names and add-on
 * names are all free text. A new brand is a new row, never a code change.
 */
export async function runSeed(opts: { wipe?: boolean } = {}) {
  if (opts.wipe) {
    await Promise.all([
      BrandModel.deleteMany({}),
      MenuAddOnModel.deleteMany({}),
      MenuItemModel.deleteMany({}),
      ComboModel.deleteMany({}),
      CouponModel.deleteMany({}),
      StoreSettingsModel.deleteMany({}),
    ]);
  }

  await StoreSettingsModel.updateOne(
    { scope: "lickyeat" },
    { $setOnInsert: { manualOpen: true } },
    { upsert: true },
  );

  await ensureDemoAdmin();

  // ---------------------------------------------------------------- brands ----
  await BrandModel.create([
    {
      brandId: "tbc",
      name: "The Blenders Club",
      tagline: "Thick shakes, blended like they mean it.",
      description:
        "Patna's loudest shake bar. Real ice cream, real fruit, no syrups pretending to be flavour — blended to order and sent out cold.",
      orderingModel: "catalog",
      status: "live",
      logoUrl: "/static/brands/tbc.svg",
      heroImageUrl: null,
      primaryColor: "#6d28d9",
      accentColor: "#ec4899",
      sortOrder: 1,
    },
    {
      brandId: "alchemy-tails",
      name: "The Alchemy Tails",
      tagline: "Cocktail-bar theatre. Zero proof.",
      description:
        "Clarified juices, smoked garnishes, house cordials and a lot of showing off — every mocktail built like a bartender's watching.",
      orderingModel: "catalog",
      status: "live",
      logoUrl: "/static/brands/alchemy-tails.svg",
      heroImageUrl: null,
      primaryColor: "#0f766e",
      accentColor: "#f59e0b",
      sortOrder: 2,
    },
    {
      brandId: "gg-tiffin",
      name: "GG Tiffin Service",
      tagline: "Ghar ka khana, roz.",
      description:
        "Home-style veg and non-veg tiffin on a weekly or monthly plan — or a single meal whenever you want one. A real rotating menu, not the same dal every day.",
      orderingModel: "tiffin",
      status: "live",
      logoUrl: "/static/brands/gg-tiffin.svg",
      heroImageUrl: null,
      primaryColor: "#b45309",
      accentColor: "#4d7c0f",
      sortOrder: 3,
    },
    {
      brandId: "the-biryani-lane",
      name: "The Biryani Lane",
      tagline: "Dum-cooked. Coming soon to Patna.",
      description:
        "Long-grain basmati, slow dum, hand-ground masala. Kachchi mutton, Hyderabadi chicken, and a serious veg dum. Launching shortly.",
      orderingModel: "catalog",
      status: "coming-soon",
      logoUrl: "/static/brands/the-biryani-lane.svg",
      heroImageUrl: null,
      primaryColor: "#9f1239",
      accentColor: "#f59e0b",
      sortOrder: 4,
    },
  ]);

  // ------------------------------------------------------- add-on catalog ----
  // Shared across every brand. Availability is global (out of whipped cream is
  // out of whipped cream everywhere it's offered).
  await MenuAddOnModel.create([
    { name: "Whipped Cream", price: 25 },
    { name: "Extra Ice Cream Scoop", price: 45 },
    { name: "Chocolate Sauce", price: 15 },
    { name: "Caramel Drizzle", price: 15 },
    { name: "Oreo Crumble", price: 20 },
    { name: "Brownie Chunks", price: 35 },
    { name: "Roasted Almonds", price: 30 },
    { name: "Extra Espresso Shot", price: 30 },
    { name: "Cold Foam", price: 25 },
    { name: "Fresh Mint", price: 10 },
    { name: "Chia Seeds", price: 20 },
    { name: "Basil (Sabja) Seeds", price: 20 },
    { name: "Tajín Chilli Rim", price: 15 },
    { name: "Nitro Ice Ball", price: 40, isAvailable: false },
    { name: "Edible Gold Flake", price: 90, isAvailable: false },
  ]);

  // -------------------------------------------------------------- TBC menu ----
  const tbc = await MenuItemModel.create([
    {
      brandId: "tbc",
      name: "Death by Chocolate",
      description:
        "Dark chocolate ice cream, cocoa, brownie, chocolate shavings. The one everyone reorders.",
      category: "Signature Thick Shakes",
      price: 240,
      portionSize: "350 ml",
      allowedAddOns: ["Whipped Cream", "Extra Ice Cream Scoop", "Brownie Chunks", "Oreo Crumble", "Chocolate Sauce"],
      sizeVariants: [{ label: "Tall (500 ml)", price: 310, isAvailable: true }],
      tags: ["bestseller", "drink"],
    },
    {
      brandId: "tbc",
      name: "Biscoff Butterscotch",
      description: "Lotus Biscoff spread, butterscotch ice cream, caramel crunch.",
      category: "Signature Thick Shakes",
      price: 250,
      portionSize: "350 ml",
      allowedAddOns: ["Whipped Cream", "Caramel Drizzle", "Roasted Almonds", "Extra Ice Cream Scoop"],
      sizeVariants: [{ label: "Tall (500 ml)", price: 320, isAvailable: true }],
      tags: ["drink"],
    },
    {
      brandId: "tbc",
      name: "Filter Kaapi Thick Shake",
      description: "South-Indian filter coffee decoction blended with vanilla ice cream.",
      category: "Signature Thick Shakes",
      price: 220,
      portionSize: "350 ml",
      supportsSugar: true,
      allowedAddOns: ["Extra Espresso Shot", "Whipped Cream", "Cold Foam"],
      tags: ["drink"],
    },
    {
      brandId: "tbc",
      name: "Alphonso Mango Shake",
      description: "Seasonal Alphonso pulp, milk, a scoop of malai kulfi. Back when mangoes are.",
      category: "Signature Thick Shakes",
      price: 210,
      portionSize: "350 ml",
      allowedAddOns: ["Extra Ice Cream Scoop", "Basil (Sabja) Seeds"],
      isAvailable: false,
      tags: ["seasonal", "drink"],
    },
    {
      brandId: "tbc",
      name: "Strawberry Cream Shake",
      description: "Fresh strawberries, cream, vanilla. Not too sweet.",
      category: "Classic Shakes",
      price: 180,
      portionSize: "300 ml",
      salePercent: 10,
      allowedAddOns: ["Whipped Cream", "Extra Ice Cream Scoop"],
      tags: ["drink"],
    },
    {
      brandId: "tbc",
      name: "Banana Peanut Butter Shake",
      description: "Banana, roasted peanut butter, dates, milk. Gym-bag approved.",
      category: "Classic Shakes",
      price: 190,
      portionSize: "300 ml",
      allowedAddOns: ["Roasted Almonds", "Chia Seeds"],
      tags: ["drink"],
    },
    {
      brandId: "tbc",
      name: "Cookies & Cream Shake",
      description: "Vanilla ice cream blitzed with a full sleeve of chocolate cream cookies.",
      category: "Classic Shakes",
      price: 185,
      portionSize: "300 ml",
      allowedAddOns: ["Oreo Crumble", "Whipped Cream", "Chocolate Sauce"],
      tags: ["drink"],
    },
    {
      brandId: "tbc",
      name: "Classic Cold Coffee",
      description: "The proper thing — strong, frothy, lightly sweet.",
      category: "Cold Coffee",
      price: 130,
      portionSize: "300 ml",
      supportsSugar: true,
      supportsIce: true,
      allowedAddOns: ["Extra Espresso Shot", "Cold Foam", "Whipped Cream"],
      sizeVariants: [{ label: "Large (450 ml)", price: 170, isAvailable: true }],
      tags: ["bestseller", "drink"],
    },
    {
      brandId: "tbc",
      name: "Hazelnut Cold Coffee",
      description: "Cold coffee with roasted hazelnut and a cocoa dusting.",
      category: "Cold Coffee",
      price: 160,
      portionSize: "300 ml",
      supportsSugar: true,
      supportsIce: true,
      allowedAddOns: ["Extra Espresso Shot", "Whipped Cream", "Caramel Drizzle"],
      tags: ["drink"],
    },
    {
      brandId: "tbc",
      name: "Affogato-Style Cold Coffee",
      description: "A double shot poured over a scoop of vanilla, then chilled and blended.",
      category: "Cold Coffee",
      price: 180,
      portionSize: "250 ml",
      isAvailable: false,
      allowedAddOns: ["Extra Espresso Shot", "Brownie Chunks"],
      tags: ["drink"],
    },
    {
      brandId: "tbc",
      name: "Virgin Mojito",
      description: "Lime, mint, soda, crushed ice. The reset button.",
      category: "Iced Teas & Mojitos",
      price: 120,
      portionSize: "300 ml",
      supportsIce: true,
      allowedAddOns: ["Fresh Mint", "Basil (Sabja) Seeds"],
      tags: ["drink"],
    },
    {
      brandId: "tbc",
      name: "Green Apple Iced Tea",
      description: "House-brewed black tea, green apple, lemon.",
      category: "Iced Teas & Mojitos",
      price: 130,
      portionSize: "350 ml",
      supportsIce: true,
      supportsSugar: true,
      allowedAddOns: ["Fresh Mint"],
      tags: ["drink"],
    },
    {
      brandId: "tbc",
      name: "Watermelon Cooler",
      description: "Cold-pressed watermelon, lime, a pinch of black salt.",
      category: "Iced Teas & Mojitos",
      price: 140,
      portionSize: "350 ml",
      supportsIce: true,
      allowedAddOns: ["Tajín Chilli Rim", "Fresh Mint"],
      tags: ["drink"],
    },
  ]);

  // ----------------------------------------------------- Alchemy Tails menu ----
  const alc = await MenuItemModel.create([
    {
      brandId: "alchemy-tails",
      name: "Smoked Blue Lagoon",
      description: "Blue curaçao cordial, citrus, sea salt — smoked with rosemary at the pass.",
      category: "Signature Mocktails",
      price: 210,
      portionSize: "250 ml",
      allowedAddOns: ["Fresh Mint", "Nitro Ice Ball"],
      tags: ["bestseller", "drink"],
    },
    {
      brandId: "alchemy-tails",
      name: "Clarified Guava & Chilli",
      description: "Milk-clarified guava, lime leaf, a whisper of bird's-eye chilli.",
      category: "Signature Mocktails",
      price: 220,
      portionSize: "250 ml",
      allowedAddOns: ["Tajín Chilli Rim", "Nitro Ice Ball"],
      tags: ["drink"],
    },
    {
      brandId: "alchemy-tails",
      name: "Kokum & Curry Leaf Sour",
      description: "Kokum, jaggery, curry-leaf oil, aquafaba foam. Coastal and unexpected.",
      category: "Signature Mocktails",
      price: 215,
      portionSize: "220 ml",
      allowedAddOns: ["Fresh Mint"],
      tags: ["drink"],
    },
    {
      brandId: "alchemy-tails",
      name: "Rosemary Citrus Spritz",
      description: "House citrus soda, rosemary, grapefruit peel.",
      category: "Spritz & Fizz",
      price: 195,
      portionSize: "300 ml",
      allowedAddOns: ["Fresh Mint"],
      tags: ["drink"],
    },
    {
      brandId: "alchemy-tails",
      name: "Passionfruit Elderflower Spritz",
      description: "Passionfruit, elderflower cordial, sparkling water.",
      category: "Spritz & Fizz",
      price: 200,
      portionSize: "300 ml",
      allowedAddOns: ["Fresh Mint", "Basil (Sabja) Seeds"],
      tags: ["drink"],
    },
    {
      brandId: "alchemy-tails",
      name: "Litchi Rose Fizz",
      description: "Litchi, gulkand, rose water, soda.",
      category: "Spritz & Fizz",
      price: 185,
      portionSize: "280 ml",
      allowedAddOns: ["Fresh Mint"],
      tags: ["drink"],
    },
    {
      brandId: "alchemy-tails",
      name: "Aam Panna Cooler",
      description: "Roasted raw mango, cumin, mint, black salt.",
      category: "Desi Coolers",
      price: 150,
      portionSize: "300 ml",
      salePercent: 15,
      allowedAddOns: ["Basil (Sabja) Seeds", "Tajín Chilli Rim"],
      tags: ["drink"],
    },
    {
      brandId: "alchemy-tails",
      name: "Spiced Tamarind Cooler",
      description: "Tamarind, jaggery, roasted cumin, a chilli rim.",
      category: "Desi Coolers",
      price: 150,
      portionSize: "300 ml",
      allowedAddOns: ["Tajín Chilli Rim", "Basil (Sabja) Seeds"],
      tags: ["drink"],
    },
    {
      brandId: "alchemy-tails",
      name: "Jaljeera Sparkling",
      description: "Cumin, mint, amchur, black salt — carbonated.",
      category: "Desi Coolers",
      price: 140,
      portionSize: "300 ml",
      allowedAddOns: ["Fresh Mint"],
      tags: ["drink"],
    },
    {
      brandId: "alchemy-tails",
      name: "Vietnamese Cold Brew",
      description: "24-hour cold brew, condensed milk, served over a clear ice block.",
      category: "Cold Brews",
      price: 170,
      portionSize: "250 ml",
      supportsSugar: true,
      allowedAddOns: ["Extra Espresso Shot", "Cold Foam"],
      tags: ["drink"],
    },
    {
      brandId: "alchemy-tails",
      name: "Orange Cold Brew Tonic",
      description: "Cold brew, tonic, fresh orange. Bright and bitter.",
      category: "Cold Brews",
      price: 185,
      portionSize: "300 ml",
      isAvailable: false,
      allowedAddOns: ["Extra Espresso Shot"],
      tags: ["drink"],
    },
  ]);

  // ------------------------------------------------------------- combos ----
  await ComboModel.create([
    {
      brandId: "tbc",
      name: "Two Signatures, One Bill",
      description: "Any two Signature Thick Shakes — priced 15% under the two on their own.",
      type: "choose-your-own",
      chooseCount: 2,
      eligibleItemIds: tbc
        .filter((i) => i.category === "Signature Thick Shakes")
        .map((i) => i._id),
      isAvailable: true,
    },
    {
      brandId: "tbc",
      name: "Coffee + Shake",
      description: "One Classic Cold Coffee and one Death by Chocolate.",
      type: "curated",
      itemIds: [tbc[7]!._id, tbc[0]!._id],
      isAvailable: true,
    },
    {
      brandId: "tbc",
      name: "Build Your Own Trio",
      description: "Pick any three TBC drinks. 15% off the lot.",
      type: "choose-your-own",
      chooseCount: 3,
      eligibleItemIds: tbc.map((i) => i._id),
      isAvailable: true,
    },
    {
      brandId: "alchemy-tails",
      name: "Mocktail Flight",
      description: "Any three Signature Mocktails to share.",
      type: "choose-your-own",
      chooseCount: 3,
      eligibleItemIds: alc
        .filter((i) => i.category === "Signature Mocktails")
        .map((i) => i._id),
      isAvailable: true,
    },
    {
      brandId: "cross-brand",
      name: "TBC × Alchemy — Date Night",
      description: "One TBC signature shake and one Alchemy signature mocktail.",
      type: "choose-your-own",
      chooseCount: 2,
      eligibleItemIds: [
        tbc[0]!._id,
        tbc[1]!._id,
        tbc[2]!._id,
        alc[0]!._id,
        alc[1]!._id,
        alc[2]!._id,
      ],
      isAvailable: true,
    },
  ]);

  // ------------------------------------------------------------- coupons ----
  await CouponModel.create([
    {
      code: "LICKY75",
      kind: "flat",
      value: 75,
      minOrderAmount: 349,
      brandId: null,
      isActive: true,
    },
    {
      code: "TBCFIRST",
      kind: "percent",
      value: 20,
      maxDiscount: 100,
      minOrderAmount: 200,
      brandId: "tbc",
      isActive: true,
    },
    {
      code: "SIPMORE",
      kind: "percent",
      value: 15,
      maxDiscount: 90,
      minOrderAmount: 300,
      brandId: "alchemy-tails",
      isActive: true,
    },
    {
      code: "WELCOME10",
      kind: "percent",
      value: 10,
      maxDiscount: 60,
      minOrderAmount: 0,
      brandId: null,
      isActive: true,
    },
  ]);
}
