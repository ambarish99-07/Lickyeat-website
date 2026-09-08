import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, patnaAddress } from "../helpers.js";
import { BrandModel } from "../../src/db/models/Brand.model.js";
import { MenuItemModel } from "../../src/db/models/MenuItem.model.js";
import { StoreSettingsModel } from "../../src/db/models/StoreSettings.model.js";
import { OrderModel } from "../../src/db/models/Order.model.js";
import { UserModel } from "../../src/db/models/User.model.js";

async function seed() {
  await Promise.all([
    BrandModel.deleteMany({}),
    MenuItemModel.deleteMany({}),
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
}

async function admin() {
  const s = await request(app)
    .post("/auth/signup")
    .send({ name: "A", email: "a-rider@example.com", password: "password123" });
  await UserModel.updateOne({ email: "a-rider@example.com" }, { role: "admin" });
  return { Authorization: `Bearer ${s.body.token}` };
}

const line = { lineId: "l1", brandId: "tbc", kind: "item", refId: "shake", quantity: 1 };

describe("rider tracking + refunds (no Razorpay keys)", () => {
  it("issues a rider link at out-for-delivery, accepts pings, hides the token from the customer", async () => {
    await seed();
    const auth = await admin();
    const create = await request(app)
      .post("/orders")
      .send({ lines: [line], address: patnaAddress, paymentMethod: "cod", guestPhone: "9876543210" });
    const id = create.body.order.id;
    const token = create.body.order.accessToken;

    // customer track: no riderToken leaked, no location yet
    let track = await request(app).get(`/orders/track/${token}`);
    expect(track.body.order.riderToken).toBeUndefined();
    expect(track.body.order.riderLocation).toBeNull();

    for (const s of ["preparing", "out-for-delivery"]) {
      await request(app).post(`/orders/admin/${id}/status`).set(auth).send({ status: s });
    }
    const dbOrder = await OrderModel.findById(id).lean();
    const riderToken = dbOrder?.riderToken;
    expect(riderToken).toBeTruthy();

    const view = await request(app).get(`/orders/rider/${riderToken}`);
    expect(view.status).toBe(200);
    expect(view.body.active).toBe(true);
    expect(view.body.orderCode).toBe(create.body.order.code);

    const ping = await request(app)
      .post(`/orders/rider/${riderToken}/ping`)
      .send({ lat: 25.62, lng: 85.13 });
    expect(ping.body).toEqual({ accepted: true });

    track = await request(app).get(`/orders/track/${token}`);
    expect(track.body.order.riderLocation).toMatchObject({ lat: 25.62, lng: 85.13 });

    // once delivered, pings are refused
    await request(app).post(`/orders/admin/${id}/status`).set(auth).send({ status: "delivered" });
    const late = await request(app)
      .post(`/orders/rider/${riderToken}/ping`)
      .send({ lat: 25.63, lng: 85.14 });
    expect(late.body).toEqual({ accepted: false });
  });

  it("records a refund on a paid-order cancellation (no keys → 'recorded')", async () => {
    await seed();
    const create = await request(app)
      .post("/orders")
      .send({ lines: [line], address: patnaAddress, paymentMethod: "razorpay", guestPhone: "9876543210" });
    const id = create.body.order.id;
    const rid = create.body.razorpayOrder.id;
    await request(app)
      .post("/orders/verify-payment")
      .send({ orderId: id, razorpayOrderId: rid, razorpayPaymentId: "pay_sim_1", razorpaySignature: "dev-ok" });

    const token = create.body.order.accessToken;
    const cancel = await request(app)
      .post(`/orders/track/${token}/cancel`)
      .send({ reason: "changed mind" });
    expect(cancel.status).toBe(200);
    expect(cancel.body.order.status).toBe("cancelled");
    // received → 100% refund; simulated payment → recorded, not pushed
    expect(cancel.body.order.cancellation.refundAmount).toBeGreaterThan(0);
    expect(cancel.body.order.cancellation.refundStatus).toBe("recorded");
    expect(cancel.body.order.payment.status).toBe("refunded");
  });
});
