import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, patnaAddress } from "../helpers.js";
import { BrandModel } from "../../src/db/models/Brand.model.js";
import { MenuItemModel } from "../../src/db/models/MenuItem.model.js";
import { StoreSettingsModel } from "../../src/db/models/StoreSettings.model.js";

async function seedMinimal() {
  await StoreSettingsModel.deleteMany({});
  await BrandModel.deleteMany({});
  await MenuItemModel.deleteMany({});
  await StoreSettingsModel.create({ scope: "lickyeat", manualOpen: true });
  await BrandModel.create({ brandId: "tbc", name: "The Blenders Club", orderingModel: "catalog", status: "live" });
  const item = await MenuItemModel.create({
    _id: "cold-coffee",
    brandId: "tbc",
    signatureName: "Cold Coffee",
    commonName: "Classic Iced Coffee",
    category: "cold-coffee",
    price: 120,
    isAvailable: true,
  });
  return { itemId: String(item._id) };
}

describe("order flow", () => {
  it("guest can preview pricing, place a COD order, track and cancel it", async () => {
    const { itemId } = await seedMinimal();

    const preview = await request(app)
      .post("/pricing/preview")
      .send({
        lines: [
          { lineId: "l1", brandId: "tbc", kind: "item", refId: itemId, quantity: 2 },
        ],
      });
    expect(preview.status).toBe(200);
    expect(preview.body.pricing.subtotal).toBe(240);
    expect(preview.body.pricing.discountPercent).toBe(10); // 2-item tier
    expect(preview.body.pricing.deliveryFee).toBe(39);

    const create = await request(app)
      .post("/orders")
      .send({
        lines: [{ lineId: "l1", brandId: "tbc", kind: "item", refId: itemId, quantity: 2 }],
        address: patnaAddress,
        paymentMethod: "cod",
        guestName: "Guest",
        guestPhone: "9876543210",
      });
    expect(create.status).toBe(201);
    const { order } = create.body;
    expect(order.status).toBe("received");
    expect(order.payment.method).toBe("cod");
    expect(order.pricing.total).toBe(preview.body.pricing.total);

    const track = await request(app).get(`/orders/track/${order.accessToken}`);
    expect(track.status).toBe(200);
    expect(track.body.order.code).toBe(order.code);

    const cancel = await request(app)
      .post(`/orders/track/${order.accessToken}/cancel`)
      .send({ reason: "changed my mind" });
    expect(cancel.status).toBe(200);
    expect(cancel.body.order.status).toBe("cancelled");
    // COD never collected money -> zero refund regardless of timing.
    expect(cancel.body.order.cancellation.refundAmount).toBe(0);
  });

  it("rejects an order to an out-of-zone address", async () => {
    const { itemId } = await seedMinimal();
    const res = await request(app)
      .post("/orders")
      .send({
        lines: [{ lineId: "l1", brandId: "tbc", kind: "item", refId: itemId, quantity: 1 }],
        address: { ...patnaAddress, city: "Mumbai", pincode: "400001" },
        paymentMethod: "cod",
        guestPhone: "9876543210",
      });
    expect(res.status).toBe(400);
  });
});
