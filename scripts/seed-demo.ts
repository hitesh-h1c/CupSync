/**
 * Demo data seed — gives you a working login for each role.
 *
 * Run with: npm run seed:demo   (after `npm run seed` for the super admin)
 * Idempotent: re-running updates the same demo vendor/employee/office.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import { User } from "../src/models/User";
import { Vendor } from "../src/models/Vendor";
import { Subscription } from "../src/models/Subscription";
import { Employee } from "../src/models/Employee";
import { Office } from "../src/models/Office";
import { Product } from "../src/models/Product";
import { Assignment } from "../src/models/Assignment";
import { hashPassword } from "../src/lib/password";
import { ROLES } from "../src/lib/roles";
import { TRIAL_DAYS } from "../src/lib/subscription";

const DEMO = {
  vendor: { name: "Ramesh Patel", business: "Ramesh Tea Stall", email: "ramesh@example.com", password: "teastall123" },
  employee: { name: "Suresh Kumar", email: "emp1@example.com", password: "emp12345", phone: "98765 43210" },
  office: { name: "Acme Corp — 3rd floor", email: "off1@example.com", password: "off12345", contactEmail: "admin@acme.com" },
  products: ["Cutting chai", "Full tea", "Coffee"],
};

async function upsertUser(email: string, fields: Record<string, unknown>, password: string) {
  const passwordHash = await hashPassword(password);
  return User.findOneAndUpdate(
    { email },
    { $set: { ...fields, email, passwordHash, active: true } },
    { upsert: true, new: true }
  );
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);

  // Vendor + trial
  const vendorUser = await upsertUser(
    DEMO.vendor.email,
    { name: DEMO.vendor.name, role: ROLES.VENDOR },
    DEMO.vendor.password
  );
  const vendor = await Vendor.findOneAndUpdate(
    { owner: vendorUser._id },
    { $set: { businessName: DEMO.vendor.business, owner: vendorUser._id } },
    { upsert: true, new: true }
  );
  await User.updateOne({ _id: vendorUser._id }, { $set: { vendor: vendor._id } });

  const now = new Date();
  await Subscription.findOneAndUpdate(
    { vendor: vendor._id },
    {
      $set: {
        vendor: vendor._id,
        status: "trialing",
        trialStartsAt: now,
        trialEndsAt: new Date(now.getTime() + TRIAL_DAYS * 86400000),
        plan: null,
      },
    },
    { upsert: true }
  );

  // Employee
  const empUser = await upsertUser(
    DEMO.employee.email,
    { name: DEMO.employee.name, role: ROLES.EMPLOYEE, vendor: vendor._id },
    DEMO.employee.password
  );
  const employee = await Employee.findOneAndUpdate(
    { user: empUser._id },
    { $set: { vendor: vendor._id, user: empUser._id, phone: DEMO.employee.phone, active: true } },
    { upsert: true, new: true }
  );

  // Office (+ its login)
  const offUser = await upsertUser(
    DEMO.office.email,
    { name: DEMO.office.name, role: ROLES.OFFICE, vendor: vendor._id },
    DEMO.office.password
  );
  const office = await Office.findOneAndUpdate(
    { user: offUser._id },
    {
      $set: {
        vendor: vendor._id,
        name: DEMO.office.name,
        contactEmail: DEMO.office.contactEmail,
        user: offUser._id,
        dailyEmailEnabled: true,
        active: true,
      },
    },
    { upsert: true, new: true }
  );
  await User.updateOne({ _id: offUser._id }, { $set: { office: office._id } });

  // Products
  for (const name of DEMO.products) {
    await Product.findOneAndUpdate(
      { vendor: vendor._id, name },
      { $set: { vendor: vendor._id, name, unit: "cup", active: true } },
      { upsert: true }
    );
  }

  // Assign employee → office
  await Assignment.findOneAndUpdate(
    { employee: employee._id, office: office._id },
    { $set: { vendor: vendor._id, employee: employee._id, office: office._id } },
    { upsert: true }
  );

  console.log("Demo data ready. Logins:");
  console.log(`  Vendor:   ${DEMO.vendor.email} / ${DEMO.vendor.password}`);
  console.log(`  Employee: ${DEMO.employee.email} / ${DEMO.employee.password}`);
  console.log(`  Office:   ${DEMO.office.email} / ${DEMO.office.password}`);

  await mongoose.disconnect();
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
