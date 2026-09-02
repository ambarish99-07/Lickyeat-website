import { createApp } from "./app.js";
import { connectDb, disconnectDb } from "./db/connect.js";
import { env } from "./config/env.js";
import { BrandModel } from "./db/models/Brand.model.js";
import { runSeed } from "./db/seedData.js";

async function main() {
  const uri = await connectDb();
  // eslint-disable-next-line no-console
  console.log(`[db] connected: ${uri.replace(/\/\/[^@]*@/, "//***@")}`);

  // Auto-seed an empty DB when asked (handy with the ephemeral in-memory Mongo).
  if (process.env.SEED_ON_BOOT === "1" && (await BrandModel.estimatedDocumentCount()) === 0) {
    // eslint-disable-next-line no-console
    console.log("[db] empty database — running seed (SEED_ON_BOOT=1)");
    await runSeed();
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[api] listening on http://localhost:${env.port}`);
  });

  const shutdown = async () => {
    server.close();
    await disconnectDb();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[api] failed to start", err);
  process.exit(1);
});
