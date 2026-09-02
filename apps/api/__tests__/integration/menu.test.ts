import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../helpers.js";
import { BrandModel } from "../../src/db/models/Brand.model.js";
import { MenuItemModel } from "../../src/db/models/MenuItem.model.js";
import { MenuAddOnModel } from "../../src/db/models/MenuAddOn.model.js";

describe("public menu", () => {
  it("returns out-of-stock items too (they are shown disabled, not hidden)", async () => {
    await BrandModel.deleteMany({});
    await MenuItemModel.deleteMany({});
    await MenuAddOnModel.deleteMany({});
    await BrandModel.create({ brandId: "tbc", name: "TBC", orderingModel: "catalog", status: "live" });
    await MenuItemModel.create([
      { brandId: "tbc", name: "In Stock Shake", category: "Shakes", price: 100, isAvailable: true },
      { brandId: "tbc", name: "Sold Out Shake", category: "Shakes", price: 120, isAvailable: false },
    ]);
    await MenuAddOnModel.create([
      { name: "Whipped Cream", price: 20, isAvailable: true },
      { name: "Gold Flake", price: 90, isAvailable: false },
    ]);

    const items = await request(app).get("/menu/tbc/items");
    expect(items.status).toBe(200);
    const names = items.body.items.map((i: { name: string }) => i.name);
    expect(names).toContain("In Stock Shake");
    expect(names).toContain("Sold Out Shake");

    const addons = await request(app).get("/menu/addons");
    const addonNames = addons.body.addOns.map((a: { name: string }) => a.name);
    expect(addonNames).toContain("Gold Flake");
  });

  it("still refuses to price an out-of-stock item at order time", async () => {
    await BrandModel.deleteMany({});
    await MenuItemModel.deleteMany({});
    await BrandModel.create({ brandId: "tbc", name: "TBC", orderingModel: "catalog", status: "live" });
    const soldOut = await MenuItemModel.create({
      brandId: "tbc",
      name: "Sold Out",
      category: "Shakes",
      price: 120,
      isAvailable: false,
    });

    const res = await request(app)
      .post("/pricing/preview")
      .send({
        lines: [
          { lineId: "l1", brandId: "tbc", kind: "item", refId: String(soldOut._id), quantity: 1 },
        ],
      });
    expect(res.status).toBe(422);
  });
});
