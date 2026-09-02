import { connectDb, disconnectDb } from "../db/connect.js";
import { UserModel } from "../db/models/User.model.js";

async function main() {
  const identifier = process.argv[2];
  if (!identifier) {
    // eslint-disable-next-line no-console
    console.error("usage: pnpm promote-admin <email-or-phone>");
    process.exit(1);
  }
  await connectDb();
  const user = await UserModel.findOneAndUpdate(
    { $or: [{ email: identifier.toLowerCase() }, { phone: identifier.replace(/\D/g, "").slice(-10) }] },
    { role: "admin" },
    { new: true },
  );
  // eslint-disable-next-line no-console
  console.log(user ? `Promoted ${user.name} (${user.email ?? user.phone}) to admin.` : "No matching user.");
  await disconnectDb();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
