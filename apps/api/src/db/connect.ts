import mongoose from "mongoose";
import { env } from "../config/env.js";

let memoryServer: { stop: (runCleanup?: boolean) => Promise<unknown> } | null = null;

/**
 * Connect to Mongo. If MONGODB_URI is unset, spin up an in-memory
 * mongodb-memory-server (local dev convenience — data does NOT persist across
 * restarts). A real URI (e.g. Atlas) makes it persistent.
 */
export async function connectDb(uriOverride?: string): Promise<string> {
  let uri = uriOverride ?? env.mongoUri;

  if (!uri) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const server = await MongoMemoryServer.create();
    memoryServer = { stop: () => server.stop() };
    uri = server.getUri();
    // eslint-disable-next-line no-console
    console.log("[db] using in-memory MongoDB (no MONGODB_URI set)");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { autoIndex: true });
  return uri;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
