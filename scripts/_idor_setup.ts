/** Temp: create Vendor B (separate tenant) + an office, for IDOR testing. */
import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import { User } from "../src/models/User";
import { Vendor } from "../src/models/Vendor";
import { Subscription } from "../src/models/Subscription";
import { Office } from "../src/models/Office";
import { hashPassword } from "../src/lib/password";
import { ROLES } from "../src/lib/roles";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const pw = await hashPassword("vendorB123");

  const owner = await User.findOneAndUpdate(
    { email: "vendorb@example.com" },
    {
      $set: {
        name: "Vendor B",
        role: ROLES.VENDOR,
        passwordHash: pw,
        active: true,
      },
    },
    { upsert: true, new: true },
  );
  const vendor = await Vendor.findOneAndUpdate(
    { owner: owner._id },
    { $set: { businessName: "Vendor B Stall", owner: owner._id } },
    { upsert: true, new: true },
  );
  await User.updateOne({ _id: owner._id }, { $set: { vendor: vendor._id } });
  await Subscription.findOneAndUpdate(
    { vendor: vendor._id },
    {
      $set: {
        vendor: vendor._id,
        status: "trialing",
        trialStartsAt: new Date(),
        trialEndsAt: new Date(Date.now() + 14 * 86400000),
      },
    },
    { upsert: true },
  );

  const offUser = await User.findOneAndUpdate(
    { email: "officeb@example.com" },
    {
      $set: {
        name: "Office B",
        role: ROLES.OFFICE,
        passwordHash: pw,
        vendor: vendor._id,
        active: true,
      },
    },
    { upsert: true, new: true },
  );
  const office = await Office.findOneAndUpdate(
    { user: offUser._id },
    {
      $set: {
        vendor: vendor._id,
        name: "Secret Office B",
        user: offUser._id,
        contactEmail: "b@example.com",
        dailyEmailEnabled: true,
        active: true,
      },
    },
    { upsert: true, new: true },
  );
  await User.updateOne({ _id: offUser._id }, { $set: { office: office._id } });

  console.log("VENDOR_B_OFFICE_ID=" + String(office._id));
  await mongoose.disconnect();
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
