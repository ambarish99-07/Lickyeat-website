import bcrypt from "bcryptjs";
import { TIFFIN_PLAN_DAYS } from "@lickyeat/shared-types";
import { BrandModel } from "./models/Brand.model.js";
import { MenuAddOnModel } from "./models/MenuAddOn.model.js";
import { MenuItemModel } from "./models/MenuItem.model.js";
import { ComboModel } from "./models/Combo.model.js";
import { CouponModel } from "./models/Coupon.model.js";
import { StoreSettingsModel } from "./models/StoreSettings.model.js";
import { TiffinPlanModel } from "./models/TiffinPlan.model.js";
import { UserModel } from "./models/User.model.js";
import { brandHeroUrl, brandLogoUrl, menuImageUrl, tiffinImageUrl } from "../lib/assets.js";

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

type Item = {
  id: string;
  signatureName: string;
  commonName: string;
  description: string;
  price: number;
  category: string;
  flavorBadges: string[];
  isPopular?: boolean;
  isNew?: boolean;
  isStaffPick?: boolean;
  isAvailable?: boolean;
  salePercent?: number;
  pairsWith?: string[];
  addOnNames?: string[];
};

const TBC_ITEMS: Item[] = [
  { id: "choco-crush", signatureName: "Choco Crush", commonName: "Rich Chocolate Shake", description: "A rich, indulgent chocolate shake topped with cocoa curls and a chocolate wafer stick.", price: 199, category: "signature-shakes", flavorBadges: ["Chocolate Lover"], isPopular: true, isStaffPick: true, pairsWith: ["hazelnut-heaven"], addOnNames: ["Whipped Cream", "Extra Ice Cream Scoop", "Chocolate Sauce"] },
  { id: "cookie-crush", signatureName: "Cookie Crush", commonName: "Cookies & Cream Shake", description: "A creamy cookies-and-cream shake loaded with chocolate sandwich cookies.", price: 219, category: "signature-shakes", flavorBadges: ["Chocolate Lover"], pairsWith: ["wafer-wonder"], addOnNames: ["Whipped Cream", "Cookie Crumble"] },
  { id: "golden-crunch", signatureName: "Golden Crunch", commonName: "Salted Caramel Praline Shake", description: "A golden caramel shake with a praline crunch and a drizzle of salted caramel.", price: 229, category: "signature-shakes", flavorBadges: ["Nutty", "Classic"], pairsWith: ["caramel-bliss"], addOnNames: ["Whipped Cream", "Caramel Drizzle", "Roasted Nuts"] },
  { id: "saffron-gold", signatureName: "Saffron Gold", commonName: "Saffron Pistachio Shake", description: "A fragrant saffron shake finished with pistachios and a hint of cardamom.", price: 249, category: "signature-shakes", flavorBadges: ["Signature", "Nutty"], isStaffPick: true, isAvailable: false },
  { id: "hazelnut-heaven", signatureName: "Hazelnut Heaven", commonName: "Chocolate Hazelnut Shake", description: "A velvety chocolate-hazelnut shake topped with roasted hazelnuts and chocolate lace.", price: 229, category: "signature-shakes", flavorBadges: ["Chocolate Lover", "Nutty"], isStaffPick: true, pairsWith: ["choco-crush"], addOnNames: ["Whipped Cream", "Roasted Nuts", "Chocolate Sauce"] },
  { id: "choco-crunch-blast", signatureName: "Choco Crunch Blast", commonName: "Chocolate Cookie Shake", description: "An extra-loaded chocolate shake with cookies, hazelnuts, and a chocolate wafer.", price: 249, category: "signature-shakes", flavorBadges: ["Chocolate Lover"], isPopular: true, isStaffPick: true, addOnNames: ["Whipped Cream", "Extra Ice Cream Scoop", "Cookie Crumble"] },
  { id: "caramel-bliss", signatureName: "Caramel Bliss", commonName: "Salted Caramel Shake", description: "A smooth caramel shake with soft caramel cubes and a spun-sugar garnish.", price: 219, category: "signature-shakes", flavorBadges: ["Classic"], pairsWith: ["golden-crunch"], addOnNames: ["Whipped Cream", "Caramel Drizzle"] },
  { id: "vanilla-dream", signatureName: "Vanilla Dream", commonName: "Classic Vanilla Bean Shake", description: "A classic vanilla bean shake, simple and smooth, finished with real vanilla pods.", price: 179, category: "signature-shakes", flavorBadges: ["Classic"], pairsWith: ["berry-bloom"] },
  { id: "berry-bloom", signatureName: "Berry Bloom", commonName: "Strawberry Shake", description: "A sweet strawberry shake swirled with fresh strawberries and whipped cream.", price: 229, category: "signature-shakes", flavorBadges: ["Fruity"], pairsWith: ["vanilla-dream"], addOnNames: ["Whipped Cream"] },
  { id: "mango-magic", signatureName: "Mango Magic", commonName: "Mango Shake", description: "A fresh, fruity mango shake topped with ripe mango slices and toasted coconut.", price: 199, category: "signature-shakes", flavorBadges: ["Fruity"], isNew: true, salePercent: 10, pairsWith: ["banana-bliss"] },
  { id: "banana-bliss", signatureName: "Banana Bliss", commonName: "Banana Shake", description: "A creamy banana shake topped with fresh banana slices and a cookie stick.", price: 179, category: "signature-shakes", flavorBadges: ["Fruity"], pairsWith: ["mango-magic"] },
  { id: "wafer-wonder", signatureName: "Wafer Wonder", commonName: "Chocolate Wafer Shake", description: "A rich chocolate shake topped with whipped cream and chocolate wafer bars.", price: 229, category: "signature-shakes", flavorBadges: ["Chocolate Lover"], pairsWith: ["cookie-crush"], addOnNames: ["Whipped Cream", "Chocolate Sauce"] },
  { id: "coffee-chill", signatureName: "Coffee Chill", commonName: "Classic Iced Coffee", description: "A classic iced coffee over ice with a light layer of cold foam.", price: 189, category: "cold-coffee", flavorBadges: ["Coffee Favorite", "Classic"], isPopular: true },
  { id: "mocha-magic", signatureName: "Mocha Magic", commonName: "Iced Mocha", description: "A rich iced mocha layered with cream and chocolate drizzle.", price: 209, category: "cold-coffee", flavorBadges: ["Coffee Favorite", "Chocolate Lover"], addOnNames: ["Whipped Cream", "Chocolate Sauce"] },
  { id: "caramel-brew", signatureName: "Caramel Brew", commonName: "Iced Caramel Coffee", description: "A smooth iced caramel coffee finished with whipped cream and a caramel drizzle.", price: 209, category: "cold-coffee", flavorBadges: ["Coffee Favorite"], isStaffPick: true, addOnNames: ["Whipped Cream", "Caramel Drizzle"] },
];

const ALCHEMY_ITEMS: Item[] = [
  { id: "berry-blast", signatureName: "Berry Blast", commonName: "Mixed Berry Mocktail", description: "A vibrant burst of mixed berries shaken with soda and a hint of mint.", price: 179, category: "mocktails", flavorBadges: ["Fruity", "Berry"] },
  { id: "blue-lagoon", signatureName: "Blue Lagoon", commonName: "Blue Curacao Mocktail", description: "A dreamy blue mocktail with citrus and a splash of lemonade, served over ice.", price: 149, category: "mocktails", flavorBadges: ["Citrus", "Signature"], isStaffPick: true },
  { id: "green-apple-fizz", signatureName: "Green Apple Fizz", commonName: "Green Apple Soda", description: "Crisp green apple syrup topped with soda for a tangy, refreshing sip.", price: 169, category: "mocktails", flavorBadges: ["Fruity", "Classic"] },
  { id: "guava-chilli-fizz", signatureName: "Guava Chilli Fizz", commonName: "Spiced Guava Fizz", description: "Sweet guava with a fiery chilli kick, balanced with lime and soda.", price: 159, category: "mocktails", flavorBadges: ["Spicy", "Tangy"], isNew: true },
  { id: "kala-khatta-fizz", signatureName: "Kala Khatta Fizz", commonName: "Black Salt Plum Fizz", description: "The classic Indian kala khatta flavor with a tangy black salt finish.", price: 149, category: "mocktails", flavorBadges: ["Tangy", "Desi"] },
  { id: "litchi-lemon-fizz", signatureName: "Litchi Lemon Fizz", commonName: "Lychee Lemon Fizz", description: "Sweet lychee balanced with zesty lemon and a fizzy finish.", price: 159, category: "mocktails", flavorBadges: ["Fruity", "Citrus"], pairsWith: ["rose-lemonade"] },
  { id: "mango-mojito", signatureName: "Mango Mojito", commonName: "Mango Mint Mojito", description: "Fresh mango pulp muddled with mint and lime over crushed ice.", price: 159, category: "mocktails", flavorBadges: ["Fruity", "Minty"], isPopular: true, pairsWith: ["watermelon-mojito"] },
  { id: "pina-colada", signatureName: "Pina Colada", commonName: "Pineapple Coconut Mocktail", description: "A creamy blend of pineapple and coconut — a tropical classic.", price: 189, category: "mocktails", flavorBadges: ["Tropical", "Creamy"], isStaffPick: true },
  { id: "pineapple-punch", signatureName: "Pineapple Punch", commonName: "Pineapple Ginger Punch", description: "Sweet pineapple juice with a subtle ginger kick and soda.", price: 189, category: "mocktails", flavorBadges: ["Tropical", "Tangy"], isStaffPick: true, pairsWith: ["pina-colada"] },
  { id: "rainbow-fizz", signatureName: "Rainbow Fizz", commonName: "Layered Fruit Fizz", description: "A layered, colorful mix of fruit syrups topped with soda.", price: 199, category: "mocktails", flavorBadges: ["Fruity", "Signature"], isNew: true, isPopular: true, isStaffPick: true },
  { id: "rose-lemonade", signatureName: "Rose Lemonade", commonName: "Rose Petal Lemonade", description: "Fragrant rose syrup with fresh lemonade, light and floral.", price: 179, category: "mocktails", flavorBadges: ["Floral", "Citrus"], pairsWith: ["litchi-lemon-fizz"] },
  { id: "shirley-temple", signatureName: "Shirley Temple", commonName: "Grenadine Ginger Ale", description: "A classic grenadine and ginger ale mocktail with a maraschino cherry.", price: 169, category: "mocktails", flavorBadges: ["Classic", "Sweet"] },
  { id: "strawberry-mojito", signatureName: "Strawberry Mojito", commonName: "Strawberry Mint Mojito", description: "Muddled strawberries with fresh mint and lime over crushed ice.", price: 149, category: "mocktails", flavorBadges: ["Fruity", "Minty"], isPopular: true, pairsWith: ["virgin-mojito"] },
  { id: "virgin-mojito", signatureName: "Virgin Mojito", commonName: "Classic Virgin Mojito", description: "The classic mojito — mint, lime, and soda, alcohol-free.", price: 129, category: "mocktails", flavorBadges: ["Classic", "Minty"], isStaffPick: true, pairsWith: ["strawberry-mojito"] },
  { id: "watermelon-mojito", signatureName: "Watermelon Mojito", commonName: "Watermelon Mint Mojito", description: "Fresh watermelon juice muddled with mint and lime.", price: 139, category: "mocktails", flavorBadges: ["Fruity", "Minty"], isNew: true, pairsWith: ["mango-mojito"] },
];

function buildItems(items: Item[], brandId: string) {
  return items.map((i) => ({
    _id: i.id,
    brandId,
    signatureName: i.signatureName,
    commonName: i.commonName,
    description: i.description,
    price: i.price,
    category: i.category,
    imageUrl: menuImageUrl(i.id),
    flavorBadges: i.flavorBadges,
    isPopular: i.isPopular,
    isNew: i.isNew,
    isStaffPick: i.isStaffPick,
    isAvailable: i.isAvailable ?? true,
    salePercent: i.salePercent,
    pairsWith: i.pairsWith ?? [],
    hasSugarIceCustomization: true,
    addOnNames: i.addOnNames ?? [],
    sizeVariants: [],
  }));
}

function curatedDuo(id: string, brandId: string, name: string, description: string, itemIds: string[]) {
  return {
    _id: id,
    brandId,
    name,
    description,
    type: "curated" as const,
    itemIds,
    imageUrl: menuImageUrl(itemIds[0]!),
    chooseCount: null,
    eligibleItemIds: [],
    discountPercent: null,
    isAvailable: true,
  };
}

function chooseTwo(id: string, brandId: string, name: string, description: string, eligibleItemIds: string[]) {
  return {
    _id: id,
    brandId,
    name,
    description,
    type: "choose-n" as const,
    itemIds: [],
    chooseCount: 2,
    eligibleItemIds,
    discountPercent: null,
    isAvailable: true,
  };
}

export async function runSeed(opts: { wipe?: boolean } = {}) {
  if (opts.wipe) {
    await Promise.all([
      BrandModel.deleteMany({}),
      MenuAddOnModel.deleteMany({}),
      MenuItemModel.deleteMany({}),
      ComboModel.deleteMany({}),
      CouponModel.deleteMany({}),
      StoreSettingsModel.deleteMany({}),
      TiffinPlanModel.deleteMany({}),
    ]);
  }

  await StoreSettingsModel.updateOne(
    { scope: "lickyeat" },
    { $setOnInsert: { manualOpen: true } },
    { upsert: true },
  );
  await ensureDemoAdmin();

  // ---------------------------------------------------------------- brands ----
  await BrandModel.deleteMany({});
  await BrandModel.create([
    {
      brandId: "tbc",
      name: "The Blenders Club",
      tagline: "Shakes, good vibes, great times.",
      description:
        "Patna's loudest shake bar — real ice cream, real fruit, blended to order. Signature thick shakes and proper cold coffee, nothing artificial pretending to be flavour.",
      orderingModel: "catalog",
      status: "live",
      logoUrl: brandLogoUrl("tbc"),
      heroImageUrl: brandHeroUrl("tbc"),
      primaryColor: "#6B3F2A",
      accentColor: "#D98E4A",
      sortOrder: 1,
    },
    {
      brandId: "alchemy-tails",
      name: "The Alchemy Tails",
      tagline: "Crafted Mixes. Magical Experiences.",
      description:
        "Cocktail-bar theatre, zero proof. Fresh juices, house cordials, smoked garnishes — mocktails built like a bartender is watching.",
      orderingModel: "catalog",
      status: "live",
      logoUrl: brandLogoUrl("alchemy-tails"),
      heroImageUrl: brandHeroUrl("alchemy-tails"),
      primaryColor: "#8A6D1F",
      accentColor: "#C9A227",
      sortOrder: 2,
    },
    {
      brandId: "gg-tiffin",
      name: "GG Tiffin Service",
      tagline: "Ghar jaise swad, roz ki yaad.",
      description:
        "Home-style Bihari tiffin, delivered daily. A real rotating weekly menu — subscribe weekly or monthly, or order a single meal whenever you want one.",
      orderingModel: "tiffin",
      status: "live",
      logoUrl: brandLogoUrl("gg-tiffin"),
      heroImageUrl: brandHeroUrl("gg-tiffin"),
      primaryColor: "#7A5A22",
      accentColor: "#B8860B",
      sortOrder: 3,
    },
    {
      brandId: "the-biryani-lane",
      name: "The Biryani Lane",
      tagline: "Dum-cooked. Coming soon to Patna.",
      description:
        "Long-grain basmati, slow dum, hand-ground masala. Kachchi mutton, Hyderabadi chicken and a serious veg dum. Launching shortly.",
      orderingModel: "catalog",
      status: "coming-soon",
      logoUrl: null,
      heroImageUrl: null,
      primaryColor: "#9f1239",
      accentColor: "#f59e0b",
      sortOrder: 4,
    },
  ]);

  // ------------------------------------------------------- menu add-ons ----
  await MenuAddOnModel.deleteMany({});
  await MenuAddOnModel.create([
    { name: "Whipped Cream", price: 25 },
    { name: "Extra Ice Cream Scoop", price: 45 },
    { name: "Chocolate Sauce", price: 15 },
    { name: "Caramel Drizzle", price: 15 },
    { name: "Cookie Crumble", price: 20 },
    { name: "Roasted Nuts", price: 30 },
    { name: "Gold Flake", price: 90, isAvailable: false },
  ]);

  // -------------------------------------------------------- menu items ----
  await MenuItemModel.deleteMany({});
  await MenuItemModel.create([...buildItems(TBC_ITEMS, "tbc"), ...buildItems(ALCHEMY_ITEMS, "alchemy-tails")]);

  // ------------------------------------------------------------- combos ----
  await ComboModel.deleteMany({});
  await ComboModel.create([
    curatedDuo("choco-hazelnut-duo", "tbc", "Choco Hazelnut Duo", "Choco Crush + Hazelnut Heaven together.", ["choco-crush", "hazelnut-heaven"]),
    curatedDuo("cookies-and-wafers", "tbc", "Cookies & Wafers", "Cookie Crush + Wafer Wonder together.", ["cookie-crush", "wafer-wonder"]),
    curatedDuo("tropical-bliss", "tbc", "Tropical Bliss", "Mango Magic + Banana Bliss together.", ["mango-magic", "banana-bliss"]),
    curatedDuo("caramel-gold-rush", "tbc", "Caramel Gold Rush", "Caramel Bliss + Golden Crunch together.", ["caramel-bliss", "golden-crunch"]),
    curatedDuo("berry-vanilla-delight", "tbc", "Berry Vanilla Delight", "Berry Bloom + Vanilla Dream together.", ["berry-bloom", "vanilla-dream"]),
    chooseTwo("tbc-choose-your-own", "tbc", "Choose Your Own Duo", "Pick any 2 from the full menu — 15% off their combined price.", TBC_ITEMS.map((i) => i.id)),
    curatedDuo("tropical-duo", "alchemy-tails", "Tropical Duo", "Pina Colada + Watermelon Mojito together.", ["pina-colada", "watermelon-mojito"]),
    curatedDuo("citrus-duo", "alchemy-tails", "Citrus Duo", "Rose Lemonade + Litchi Lemon Fizz together.", ["rose-lemonade", "litchi-lemon-fizz"]),
    curatedDuo("mojito-duo", "alchemy-tails", "Mojito Duo", "Strawberry Mojito + Mango Mojito together.", ["strawberry-mojito", "mango-mojito"]),
    curatedDuo("spicy-fizz-duo", "alchemy-tails", "Spicy Fizz Duo", "Guava Chilli Fizz + Kala Khatta Fizz together.", ["guava-chilli-fizz", "kala-khatta-fizz"]),
    curatedDuo("berry-rainbow-duo", "alchemy-tails", "Berry Rainbow Duo", "Berry Blast + Rainbow Fizz together.", ["berry-blast", "rainbow-fizz"]),
    chooseTwo("alchemy-choose-your-own", "alchemy-tails", "Build Your Own Duo", "Pick any 2 mocktails — 15% off their combined price.", ALCHEMY_ITEMS.map((i) => i.id)),
    chooseTwo(
      "mix-and-match-duo",
      "cross-brand",
      "Mix & Match Duo",
      "A shake and a mocktail, or whatever you like — pick any 2 across every Lickyeat brand at 15% off.",
      [...TBC_ITEMS, ...ALCHEMY_ITEMS].map((i) => i.id),
    ),
  ]);

  // ------------------------------------------------------------- coupons ----
  await CouponModel.deleteMany({});
  await CouponModel.create([
    { code: "WELCOME50", kind: "percent", value: 50, maxDiscount: 100, minOrderAmount: 0, brandId: null, oncePerCustomer: true, isActive: true },
    { code: "FLAT50", kind: "flat", value: 50, minOrderAmount: 200, brandId: null, isActive: true },
    { code: "FLAT100", kind: "flat", value: 100, minOrderAmount: 499, brandId: null, isActive: true },
    { code: "FLAT125", kind: "flat", value: 125, minOrderAmount: 599, brandId: null, isActive: true },
    { code: "FLAT150", kind: "flat", value: 150, minOrderAmount: 699, brandId: null, isActive: true },
    { code: "FLAT175", kind: "flat", value: 175, minOrderAmount: 799, brandId: null, isActive: true },
    { code: "FLAT200", kind: "flat", value: 200, minOrderAmount: 899, brandId: null, isActive: true },
    { code: "FLAT250", kind: "flat", value: 250, minOrderAmount: 999, brandId: null, isActive: true },
    { code: "FLAT300", kind: "flat", value: 300, minOrderAmount: 1299, brandId: null, isActive: true },
    { code: "FLAT400", kind: "flat", value: 400, minOrderAmount: 1499, brandId: null, isActive: true },
  ]);

  // -------------------------------------------------------- tiffin plans ----
  await TiffinPlanModel.deleteMany({});
  const vegImg = tiffinImageUrl("veg-tiffin");
  const nvImg = tiffinImageUrl("non-veg-tiffin");
  const plan = (
    name: string,
    diet: "veg" | "non-veg",
    style: "single" | "twice-daily" | "thrice-daily",
    duration: "weekly" | "monthly",
    price: number,
    salePercent?: number,
  ) => ({
    name,
    diet,
    style,
    duration,
    durationDays: TIFFIN_PLAN_DAYS[duration],
    price,
    salePercent: salePercent ?? null,
    imageUrl: diet === "veg" ? vegImg : nvImg,
    active: true,
  });
  await TiffinPlanModel.create([
    plan("Weekly Veg — One Meal a Day", "veg", "single", "weekly", 899),
    plan("Weekly Non-Veg — One Meal a Day", "non-veg", "single", "weekly", 1399),
    plan("Monthly Veg — One Meal a Day", "veg", "single", "monthly", 3499, 20),
    plan("Monthly Non-Veg — One Meal a Day", "non-veg", "single", "monthly", 5499, 25),
    plan("Weekly Veg — Lunch & Dinner", "veg", "twice-daily", "weekly", 1699),
    plan("Weekly Non-Veg — Lunch & Dinner", "non-veg", "twice-daily", "weekly", 2599),
    plan("Monthly Veg — Lunch & Dinner", "veg", "twice-daily", "monthly", 6499),
    plan("Monthly Non-Veg — Lunch & Dinner", "non-veg", "twice-daily", "monthly", 9999),
    plan("Weekly Veg — All Three Meals", "veg", "thrice-daily", "weekly", 2399),
    plan("Weekly Non-Veg — All Three Meals", "non-veg", "thrice-daily", "weekly", 3599),
    plan("Monthly Veg — All Three Meals", "veg", "thrice-daily", "monthly", 8999),
    plan("Monthly Non-Veg — All Three Meals", "non-veg", "thrice-daily", "monthly", 13999, 30),
  ]);
}
