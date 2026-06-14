/**
 * Seed script — creates (or updates) the platform Super Admin.
 *
 * Run with: npm run seed
 * Reads credentials from .env.local (SUPER_ADMIN_*).
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import { User } from "../src/models/User";
import { hashPassword } from "../src/lib/password";
import { ROLES } from "../src/lib/roles";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");

  const name = process.env.SUPER_ADMIN_NAME ?? "Platform Owner";
  const email = (process.env.SUPER_ADMIN_EMAIL ?? "admin@cupsync.app").toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "ChangeMe!123";

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const passwordHash = await hashPassword(password);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.name = name;
    existing.passwordHash = passwordHash;
    existing.role = ROLES.SUPER_ADMIN;
    existing.active = true;
    await existing.save();
    console.log(`Updated existing super admin: ${email}`);
  } else {
    await User.create({
      name,
      email,
      passwordHash,
      role: ROLES.SUPER_ADMIN,
      active: true,
    });
    console.log(`Created super admin: ${email}`);
  }

  console.log("\nLogin with:");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
