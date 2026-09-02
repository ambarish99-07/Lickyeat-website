import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, patnaAddress } from "../helpers.js";
import { BrandModel } from "../../src/db/models/Brand.model.js";
import { MenuItemModel } from "../../src/db/models/MenuItem.model.js";
import { CouponModel } from "../../src/db/models/Coupon.model.js";
import { StoreSettingsModel } from "../../src/db/models/StoreSettings.model.js";
import { OrderModel } from "../../src/db/models/Order.model.js";
import { UserModel } from "../../src/db/models/User.model.js";

async function seed() {
  await Promise.all([
    BrandModel.deleteMany({}),
    MenuItemModel.deleteMany({}),
    CouponModel.deleteMany({}),
    StoreSettingsModel.deleteMany({}),
    OrderModel.deleteMany({}),
    UserModel.deleteMany({}),
  ]);
  await StoreSettingsModel.create({ scope: "lickyeat", manualOpen: true });
  await BrandModel.create({ brandId: "tbc", name: "TBC", orderingModel: "catalog", status: "live" });
  await MenuItemModel.create({
    _id: "shake",
    brandId: "tbc",
    signatureName: "Shake",
    commonName: "A Shake",
    category: "signature-shakes",
    price: 300,
    isAvailable: true,
  });
  await MenuItemModel.create({
    _id: "juice",
    brandId: "tbc",
    signatureName: "Juice",
    commonName: "A Juice",
    category: "signature-shakes",
    price: 120,
    isAvailable: true,
  });
  await CouponModel.create([
    { code: "WELCOME50", kind: "percent", value: 50, maxDiscount: 100, minOrderAmount: 0, oncePerCustomer: true, isActive: true },
    { code: "FLAT50", kind: "flat", value: 50, minOrderAmount: 200, isActive: true },
    { code: "BOGO1", kind: "bogo", value: 0, minOrderAmount: 0, oncePerCustomer: true, isActive: true },
  ]);
}

const line = { lineId: "l1", brandId: "tbc", kind: "item", refId: "shake", quantity: 2 };

describe("coupons", () => {
  it("lists available offers with human summaries", async () => {
    await seed();
    const res = await request(app).get("/coupons/available");
    expect(res.status).toBe(200);
    const welcome = res.body.coupons.find((c: { code: string }) => c.code === "WELCOME50");
    expect(welcome.summary).toBe("50% off (up to ₹100)");
    expect(welcome.oncePerCustomer).toBe(true);
  });

  it("enforces once-per-customer for WELCOME50 but not FLAT50", async () => {
    await seed();
    const signup = await request(app)
      .post("/auth/signup")
      .send({ name: "C", email: "c@example.com", password: "password123" });
    const auth = { Authorization: `Bearer ${signup.body.token}` };

    const first = await request(app)
      .post("/orders")
      .set(auth)
      .send({ lines: [line], address: patnaAddress, paymentMethod: "cod", couponCode: "WELCOME50" });
    expect(first.status).toBe(201);
    expect(first.body.order.pricing.couponDiscount).toBe(100);

    const preview = await request(app)
      .post("/pricing/preview")
      .set(auth)
      .send({ lines: [line], couponCode: "WELCOME50" });
    expect(preview.body.pricing.couponDiscount).toBe(0);

    const second = await request(app)
      .post("/orders")
      .set(auth)
      .send({ lines: [line], address: patnaAddress, paymentMethod: "cod", couponCode: "WELCOME50" });
    expect(second.status).toBe(400);

    // FLAT50 is reusable
    const f1 = await request(app)
      .post("/orders")
      .set(auth)
      .send({ lines: [line], address: patnaAddress, paymentMethod: "cod", couponCode: "FLAT50" });
    const f2 = await request(app)
      .post("/orders")
      .set(auth)
      .send({ lines: [line], address: patnaAddress, paymentMethod: "cod", couponCode: "FLAT50" });
    expect(f1.status).toBe(201);
    expect(f2.status).toBe(201);
  });

  it("BOGO1 discounts the cheapest eligible unit and needs 2+ items", async () => {
    await seed();
    // one ₹300 shake + one ₹120 juice → cheapest unit (₹120) comes off
    const preview = await request(app)
      .post("/pricing/preview")
      .send({
        lines: [
          { lineId: "l1", brandId: "tbc", kind: "item", refId: "shake", quantity: 1 },
          { lineId: "l2", brandId: "tbc", kind: "item", refId: "juice", quantity: 1 },
        ],
        couponCode: "BOGO1",
      });
    expect(preview.status).toBe(200);
    expect(preview.body.pricing.couponDiscount).toBe(120);

    // a single item → nothing to "get free"
    const single = await request(app)
      .post("/pricing/preview")
      .send({
        lines: [{ lineId: "l1", brandId: "tbc", kind: "item", refId: "shake", quantity: 1 }],
        couponCode: "BOGO1",
      });
    expect(single.body.pricing.couponDiscount).toBe(0);
  });
});
