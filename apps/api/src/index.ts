import { createApp } from "./app.js";
import { connectDb, disconnectDb } from "./db/connect.js";
import { env } from "./config/env.js";

async function main() {
  const uri = await connectDb();
  // eslint-disable-next-line no-console
  console.log(`[db] connected: ${uri.replace(/\/\/[^@]*@/, "//***@")}`);

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
