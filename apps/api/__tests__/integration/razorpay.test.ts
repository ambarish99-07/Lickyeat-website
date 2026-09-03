import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, patnaAddress } from "../helpers.js";
import { BrandModel } from "../../src/db/models/Brand.model.js";
import { MenuItemModel } from "../../src/db/models/MenuItem.model.js";
import { StoreSettingsModel } from "../../src/db/models/StoreSettings.model.js";
import { OrderModel } from "../../src/db/models/Order.model.js";
import { TiffinSingleMealOrderModel } from "../../src/db/models/TiffinSingleMealOrder.model.js";
import { UserModel } from "../../src/db/models/User.model.js";

async function seed() {
  await Promise.all([
    BrandModel.deleteMany({}),
    MenuItemModel.deleteMany({}),
    StoreSettingsModel.deleteMany({}),
    OrderModel.deleteMany({}),
    TiffinSingleMealOrderModel.deleteMany({}),
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
}

const line = { lineId: "l1", brandId: "tbc", kind: "item", refId: "shake", quantity: 1 };

describe("razorpay (simulated — no keys configured)", () => {
  it("reports payments config", async () => {
    const res = await request(app).get("/payments/config");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ razorpay: false });
  });

  it("regular order: returns a local stub order, then verifies with the dev signature", async () => {
    await seed();
    const create = await request(app)
      .post("/orders")
      .send({ lines: [line], address: patnaAddress, paymentMethod: "razorpay", guestPhone: "9876543210" });
    expect(create.status).toBe(201);
    expect(create.body.razorpayOrder.id).toMatch(/^order_local_/);
    expect(create.body.razorpayOrder.keyId).toBe("rzp_test_local");
    expect(create.body.order.payment.status).toBe("pending");

    const verify = await request(app)
      .post("/orders/verify-payment")
      .send({
        orderId: create.body.order.id,
        razorpayOrderId: create.body.razorpayOrder.id,
        razorpayPaymentId: "pay_sim_1",
        razorpaySignature: "dev-ok",
      });
    expect(verify.status).toBe(200);
    expect(verify.body.order.payment.status).toBe("paid");

    const bad = await request(app)
      .post("/orders/verify-payment")
      .send({
        orderId: create.body.order.id,
        razorpayOrderId: create.body.razorpayOrder.id,
        razorpayPaymentId: "pay_x",
        razorpaySignature: "not-dev-ok",
      });
    expect(bad.status).toBe(400);
  });

  it("tiffin single meal: online payment creates a stub order + verify endpoint", async () => {
    await seed();
    const future = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
    const create = await request(app)
      .post("/tiffin/single-meal/orders")
      .send({
        diet: "veg",
        tier: "regular",
        meal: "lunch",
        date: future,
        quantity: 1,
        addOns: [],
        address: patnaAddress,
        paymentMethod: "razorpay",
        guestPhone: "9876543210",
      });
    expect(create.status).toBe(201);
    expect(create.body.razorpayOrder.id).toMatch(/^order_local_/);

    const verify = await request(app)
      .post("/tiffin/single-meal/orders/verify-payment")
      .send({
        orderId: create.body.order.id,
        razorpayOrderId: create.body.razorpayOrder.id,
        razorpayPaymentId: "pay_sim_1",
        razorpaySignature: "dev-ok",
      });
    expect(verify.status).toBe(200);
    expect(verify.body.order.payment.status).toBe("paid");
  });

  it("COD order returns no razorpayOrder", async () => {
    await seed();
    const create = await request(app)
      .post("/orders")
      .send({ lines: [line], address: patnaAddress, paymentMethod: "cod", guestPhone: "9876543210" });
    expect(create.body.razorpayOrder).toBeNull();
  });
});
