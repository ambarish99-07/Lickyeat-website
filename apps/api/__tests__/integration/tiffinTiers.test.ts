import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, patnaAddress } from "../helpers.js";
import { TiffinPlanModel } from "../../src/db/models/TiffinPlan.model.js";
import { TiffinSubscriptionModel } from "../../src/db/models/TiffinSubscription.model.js";
import { UserModel } from "../../src/db/models/User.model.js";

async function reset() {
  await Promise.all([
    TiffinPlanModel.deleteMany({}),
    TiffinSubscriptionModel.deleteMany({}),
    UserModel.deleteMany({}),
  ]);
  await TiffinPlanModel.create([
    { name: "Monthly Premium Veg — All Three Meals", diet: "veg", tier: "premium", style: "thrice-daily", duration: "monthly", durationDays: 30, price: 3900, active: true },
    { name: "Monthly Mini Veg — One Meal a Day", diet: "veg", tier: "mini", style: "single", duration: "monthly", durationDays: 30, price: 1600, active: true },
    { name: "Monthly Veg — Lunch Only", diet: "veg", tier: "regular", style: "lunch-only", duration: "monthly", durationDays: 30, price: 2499, active: true },
    { name: "Monthly Mini Veg — Thrice (invalid)", diet: "veg", tier: "mini", style: "thrice-daily", duration: "monthly", durationDays: 30, price: 3000, active: true },
  ]);
}

async function auth() {
  const s = await request(app).post("/auth/signup").send({ name: "T", email: "tier@example.com", password: "password123" });
  return { Authorization: `Bearer ${s.body.token}` };
}

async function planId(name: string) {
  const p = await TiffinPlanModel.findOne({ name }).lean();
  return String(p!._id);
}

const START = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

describe("tiffin tiers", () => {
  it("a Premium thrice-daily plan schedules Premium-tier dishes (3 meals/day)", async () => {
    await reset();
    const h = await auth();
    const res = await request(app)
      .post("/tiffin/subscriptions")
      .set(h)
      .send({ planId: await planId("Monthly Premium Veg — All Three Meals"), startDate: START, address: patnaAddress, paymentMethod: "razorpay" });
    expect(res.status).toBe(201);
    const sub = res.body.subscription;
    expect(sub.tier).toBe("premium");
    // 30 delivery days × 3 meals
    expect(sub.meals.length).toBe(90);
    expect(sub.meals.filter((m: { meal: string }) => m.meal === "breakfast").length).toBe(30);
  });

  it("a Mini single plan restricted to lunch/dinner is fine; breakfast is rejected", async () => {
    await reset();
    const h = await auth();
    const ok = await request(app)
      .post("/tiffin/subscriptions")
      .set(h)
      .send({ planId: await planId("Monthly Mini Veg — One Meal a Day"), startDate: START, address: patnaAddress, mealType: "lunch", paymentMethod: "razorpay" });
    expect(ok.status).toBe(201);
    expect(ok.body.subscription.tier).toBe("mini");

    const bad = await request(app)
      .post("/tiffin/subscriptions")
      .set(h)
      .send({ planId: await planId("Monthly Mini Veg — One Meal a Day"), startDate: START, address: patnaAddress, mealType: "breakfast", paymentMethod: "razorpay" });
    expect(bad.status).toBe(400);
  });

  it("a lunch-only plan schedules exactly one lunch per day", async () => {
    await reset();
    const h = await auth();
    const res = await request(app)
      .post("/tiffin/subscriptions")
      .set(h)
      .send({ planId: await planId("Monthly Veg — Lunch Only"), startDate: START, address: patnaAddress, paymentMethod: "razorpay" });
    expect(res.status).toBe(201);
    expect(res.body.subscription.meals.length).toBe(30);
    expect(res.body.subscription.meals.every((m: { meal: string }) => m.meal === "lunch")).toBe(true);
  });

  it("rejects a Mini thrice-daily plan (needs breakfast Mini doesn't have)", async () => {
    await reset();
    const h = await auth();
    const res = await request(app)
      .post("/tiffin/subscriptions")
      .set(h)
      .send({ planId: await planId("Monthly Mini Veg — Thrice (invalid)"), startDate: START, address: patnaAddress, paymentMethod: "razorpay" });
    expect(res.status).toBe(400);
  });
});
