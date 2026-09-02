import { afterAll, beforeAll } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";

let mongo: MongoMemoryServer;

export const app = createApp();

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

export const patnaAddress = {
  label: "Home",
  line1: "12 Boring Road",
  line2: "",
  city: "Patna",
  pincode: "800001",
  withinDeliveryRadius: true,
};
