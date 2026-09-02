import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../helpers.js";

describe("auth", () => {
  it("signs up, logs in with email or phone, and returns the current user", async () => {
    const signup = await request(app).post("/auth/signup").send({
      name: "Asha",
      email: "asha@example.com",
      phone: "9876500011",
      password: "supersecret1",
    });
    expect(signup.status).toBe(201);
    expect(signup.body.token).toBeTruthy();
    expect(signup.body.user.email).toBe("asha@example.com");

    const byEmail = await request(app)
      .post("/auth/login")
      .send({ identifier: "asha@example.com", password: "supersecret1" });
    expect(byEmail.status).toBe(200);

    const byPhone = await request(app)
      .post("/auth/login")
      .send({ identifier: "9876500011", password: "supersecret1" });
    expect(byPhone.status).toBe(200);

    const me = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${byPhone.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.name).toBe("Asha");
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/auth/signup").send({
      name: "Dup",
      email: "dup@example.com",
      password: "supersecret1",
    });
    const again = await request(app).post("/auth/signup").send({
      name: "Dup2",
      email: "dup@example.com",
      password: "supersecret1",
    });
    expect(again.status).toBe(409);
  });
});
