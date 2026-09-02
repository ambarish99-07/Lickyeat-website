import { connectDb, disconnectDb } from "./db/connect.js";
import { runSeed } from "./db/seedData.js";

async function seed() {
  await connectDb();
  await runSeed({ wipe: true });
  // eslint-disable-next-line no-console
  console.log(
    "[seed] done. Sign up via the web app, then `pnpm --filter @lickyeat/api promote-admin <email>`.",
  );
  await disconnectDb();
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[seed] failed", err);
  process.exit(1);
});
