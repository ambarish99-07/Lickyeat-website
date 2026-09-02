import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../helpers.js";
import { BrandModel } from "../../src/db/models/Brand.model.js";
import { LeadModel } from "../../src/db/models/Lead.model.js";
import { AdminAlertModel } from "../../src/db/models/AdminAlert.model.js";
import { UserModel } from "../../src/db/models/User.model.js";

async function reset() {
  await Promise.all([
    BrandModel.deleteMany({}),
    LeadModel.deleteMany({}),
    AdminAlertModel.deleteMany({}),
    UserModel.deleteMany({}),
  ]);
  await BrandModel.create({ brandId: "tbc", name: "The Blenders Club", orderingModel: "catalog", status: "live" });
}

async function adminAuth() {
  const signup = await request(app)
    .post("/auth/signup")
    .send({ name: "Admin", email: "admin-lead@example.com", password: "password123" });
  await UserModel.updateOne({ email: "admin-lead@example.com" }, { role: "admin" });
  return { Authorization: `Bearer ${signup.body.token}` };
}

describe("leads", () => {
  it("accepts a franchise enquiry, returns a brief, and raises a high-priority alert for a call-back", async () => {
    await reset();
    const res = await request(app)
      .post("/leads?from=franchise")
      .send({
        kind: "franchise",
        name: "Rohit Anand",
        whatsapp: "98765 43210",
        city: "Ranchi",
        scope: "single-brand",
        brandId: "tbc",
        investmentBand: "₹15–30 lakh",
        callbackRequested: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.brief).toContain("franchise");
    expect(res.body.lead.whatsapp).toBe("9876543210"); // normalised

    const lead = await LeadModel.findById(res.body.lead.id).lean();
    expect(lead?.kind).toBe("franchise");
    expect(lead?.callbackRequested).toBe(true);
    expect(lead?.details).toMatchObject({ scope: "single-brand", brandId: "tbc" });

    const alert = await AdminAlertModel.findOne({ leadId: res.body.lead.id }).lean();
    expect(alert?.priority).toBe("high");
    expect(alert?.type).toBe("lead.callback");
  });

  it("rejects a single-brand franchise enquiry with no brand and a bot honeypot hit", async () => {
    await reset();
    const noBrand = await request(app)
      .post("/leads")
      .send({ kind: "franchise", name: "No Brand", whatsapp: "9876543210", city: "Gaya", scope: "single-brand" });
    expect(noBrand.status).toBe(400);

    const bot = await request(app)
      .post("/leads")
      .send({
        kind: "catering",
        name: "Bot",
        whatsapp: "9876543210",
        city: "Patna",
        eventType: "corporate",
        guestCount: 50,
        company: "spam co", // honeypot must be empty
      });
    expect(bot.status).toBe(400);
  });

  it("lets an admin list leads, filter call-backs, update status, and clear alerts", async () => {
    await reset();
    const auth = await adminAuth();

    await request(app)
      .post("/leads")
      .send({ kind: "catering", name: "Priya", whatsapp: "9900112233", city: "Patna", eventType: "wedding", guestCount: 300, callbackRequested: false });
    const cb = await request(app)
      .post("/leads")
      .send({ kind: "callback", name: "Aakash", whatsapp: "9765432100", city: "Muzaffarpur", topic: "franchise" });

    const all = await request(app).get("/leads").set(auth);
    expect(all.status).toBe(200);
    expect(all.body.leads).toHaveLength(2);

    const callbacks = await request(app).get("/leads?callback=1").set(auth);
    expect(callbacks.body.leads).toHaveLength(1);
    expect(callbacks.body.leads[0].kind).toBe("callback");

    const updated = await request(app)
      .patch(`/leads/${cb.body.lead.id}`)
      .set(auth)
      .send({ status: "contacted", note: "Called, meeting Friday" });
    expect(updated.body.lead.status).toBe("contacted");
    expect(updated.body.lead.notes[0].body).toBe("Called, meeting Friday");

    const count = await request(app).get("/leads/alerts/count").set(auth);
    expect(count.body.total).toBe(2);
    expect(count.body.callbacks).toBe(1);

    const cleared = await request(app).post("/leads/alerts/read").set(auth).send({ ids: [] });
    expect(cleared.body.total).toBe(0);
  });

  it("requires auth for the admin endpoints", async () => {
    await reset();
    const res = await request(app).get("/leads");
    expect(res.status).toBe(401);
  });
});
