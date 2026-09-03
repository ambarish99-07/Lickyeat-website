import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, patnaAddress } from "../helpers.js";
import { BrandModel } from "../../src/db/models/Brand.model.js";
import { MenuItemModel } from "../../src/db/models/MenuItem.model.js";
import { MenuAddOnModel } from "../../src/db/models/MenuAddOn.model.js";
import { StoreSettingsModel } from "../../src/db/models/StoreSettings.model.js";
import { OrderModel } from "../../src/db/models/Order.model.js";
import { UserModel } from "../../src/db/models/User.model.js";

async function seed() {
  await Promise.all([
    StoreSettingsModel.deleteMany({}),
    BrandModel.deleteMany({}),
    MenuItemModel.deleteMany({}),
    MenuAddOnModel.deleteMany({}),
    OrderModel.deleteMany({}),
    UserModel.deleteMany({}),
  ]);
  await StoreSettingsModel.create({ scope: "lickyeat", manualOpen: true });
  await BrandModel.create({ brandId: "tbc", name: "The Blenders Club", orderingModel: "catalog", status: "live" });
  await MenuAddOnModel.create({ name: "Whipped Cream", price: 25, isAvailable: true });
  await MenuItemModel.create({
    _id: "choco-crush",
    brandId: "tbc",
    signatureName: "Choco Crush",
    commonName: "Rich Chocolate Shake",
    category: "signature-shakes",
    price: 200,
    addOnNames: ["Whipped Cream"],
    isAvailable: true,
  });
}

async function authFor(email: string) {
  const s = await request(app).post("/auth/signup").send({ name: "C", email, password: "password123" });
  return { token: s.body.token as string, userId: s.body.user.id as string };
}

async function placeAndDeliver(token: string) {
  const create = await request(app)
    .post("/orders")
    .set({ Authorization: `Bearer ${token}` })
    .send({
      lines: [
        {
          lineId: "l1",
          brandId: "tbc",
          kind: "item",
          refId: "choco-crush",
          quantity: 2,
          customization: { addOns: ["Whipped Cream"], comboItemIds: [], sugar: "less" },
        },
      ],
      address: patnaAddress,
      paymentMethod: "cod",
    });
  const id = create.body.order.id;
  await OrderModel.updateOne({ _id: id }, { status: "delivered" });
  return id as string;
}

describe("reorder", () => {
  it("re-resolves a delivered order's lines at current prices", async () => {
    await seed();
    const { token } = await authFor("re1@example.com");
    const orderId = await placeAndDeliver(token);

    const res = await request(app)
      .get(`/orders/${orderId}/reorder`)
      .set({ Authorization: `Bearer ${token}` });

    expect(res.status).toBe(200);
    const r = res.body.reorder;
    expect(r.brandId).toBe("tbc");
    expect(r.lines).toHaveLength(1);
    expect(r.lines[0]).toMatchObject({
      refId: "choco-crush",
      quantity: 2,
      unitBasePrice: 200,
      unitAddOnsPrice: 25,
      customization: { addOns: ["Whipped Cream"], sugar: "less" },
    });
    expect(r.unavailable).toEqual([]);
    expect(r.priceChanged).toBe(false);
  });

  it("flags a price change and drops an item that went out of stock", async () => {
    await seed();
    const { token } = await authFor("re2@example.com");
    const orderId = await placeAndDeliver(token);

    await MenuItemModel.updateOne({ _id: "choco-crush" }, { price: 240 });
    await MenuAddOnModel.updateOne({ name: "Whipped Cream" }, { isAvailable: false });

    const res = await request(app)
      .get(`/orders/${orderId}/reorder`)
      .set({ Authorization: `Bearer ${token}` });

    expect(res.status).toBe(200);
    const r = res.body.reorder;
    expect(r.lines[0].unitBasePrice).toBe(240);
    expect(r.lines[0].unitAddOnsPrice).toBe(0); // add-on dropped
    expect(r.lines[0].customization.addOns).toEqual([]);
    expect(r.priceChanged).toBe(true);
  });

  it("refuses a non-delivered order and someone else's order", async () => {
    await seed();
    const { token } = await authFor("re3@example.com");
    const other = await authFor("re4@example.com");

    const create = await request(app)
      .post("/orders")
      .set({ Authorization: `Bearer ${token}` })
      .send({
        lines: [{ lineId: "l1", brandId: "tbc", kind: "item", refId: "choco-crush", quantity: 1 }],
        address: patnaAddress,
        paymentMethod: "cod",
      });
    const orderId = create.body.order.id;

    const notDelivered = await request(app)
      .get(`/orders/${orderId}/reorder`)
      .set({ Authorization: `Bearer ${token}` });
    expect(notDelivered.status).toBe(400);

    await OrderModel.updateOne({ _id: orderId }, { status: "delivered" });
    const wrongUser = await request(app)
      .get(`/orders/${orderId}/reorder`)
      .set({ Authorization: `Bearer ${other.token}` });
    expect(wrongUser.status).toBe(403);

    const anon = await request(app).get(`/orders/${orderId}/reorder`);
    expect(anon.status).toBe(401);
  });
});
