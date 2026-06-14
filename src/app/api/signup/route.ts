import { NextResponse } from "next/server";
import { z } from "zod";
import type { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Vendor } from "@/models/Vendor";
import { Subscription } from "@/models/Subscription";
import { hashPassword } from "@/lib/password";
import { ROLES } from "@/lib/roles";
import { TRIAL_DAYS } from "@/lib/subscription";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  businessName: z.string().trim().min(2, "Enter your business name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, businessName, email, password } = parsed.data;

  await dbConnect();

  const existing = await User.findOne({ email }).select("_id").lean();
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  // Standalone MongoDB has no multi-doc transactions, so create sequentially
  // and roll back by hand if a later step fails.
  let userId: Types.ObjectId | null = null;
  let vendorId: Types.ObjectId | null = null;
  try {
    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: ROLES.VENDOR,
      active: true,
    });
    userId = user._id;

    const vendor = await Vendor.create({ businessName, owner: user._id });
    vendorId = vendor._id;

    user.vendor = vendor._id;
    await user.save();

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    await Subscription.create({
      vendor: vendor._id,
      status: "trialing",
      trialStartsAt: now,
      trialEndsAt,
      plan: null,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    // Best-effort cleanup so a partial signup never blocks a retry.
    if (vendorId) await Vendor.deleteOne({ _id: vendorId }).catch(() => {});
    if (userId) await User.deleteOne({ _id: userId }).catch(() => {});
    console.error("Signup failed:", err);
    return NextResponse.json(
      { error: "Could not create your account. Please try again." },
      { status: 500 }
    );
  }
}
