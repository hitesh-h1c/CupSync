"use server";

import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { ROLES } from "@/lib/roles";
import { runAction, type ActionResult } from "@/lib/action-result";
import { Vendor } from "@/models/Vendor";
import { Subscription, type SubscriptionStatus } from "@/models/Subscription";
import { User } from "@/models/User";

const DAY_MS = 86400000;

/** Extend (or restart) a vendor's free trial by N days. */
export async function extendTrial(vendorId: string, days: number): Promise<ActionResult> {
  return runAction(async () => {
    await requireRole(ROLES.SUPER_ADMIN);
    if (!Number.isInteger(days) || days <= 0 || days > 365) {
      return { ok: false, error: "Enter 1–365 days." };
    }

    await dbConnect();
    const sub = await Subscription.findOne({ vendor: vendorId });
    if (!sub) return { ok: false, error: "Subscription not found." };

    // Extend from whichever is later: now or the existing end date.
    const base = Math.max(Date.now(), new Date(sub.trialEndsAt).getTime());
    sub.trialEndsAt = new Date(base + days * DAY_MS);
    sub.status = "trialing";
    await sub.save();

    revalidatePath("/admin/vendors");
    revalidatePath("/admin");
    return { ok: true, message: `Trial extended by ${days} days.` };
  });
}

/** Set a vendor's subscription status (trialing / active / expired). */
export async function setSubscriptionStatus(
  vendorId: string,
  status: SubscriptionStatus
): Promise<ActionResult> {
  return runAction(async () => {
    await requireRole(ROLES.SUPER_ADMIN);
    if (!["trialing", "active", "expired"].includes(status)) {
      return { ok: false, error: "Invalid status." };
    }

    await dbConnect();
    const sub = await Subscription.findOne({ vendor: vendorId });
    if (!sub) return { ok: false, error: "Subscription not found." };

    sub.status = status;
    if (status === "active") sub.plan = sub.plan ?? "manual";
    await sub.save();

    revalidatePath("/admin/vendors");
    revalidatePath("/admin");
    return { ok: true, message: `Subscription set to ${status}.` };
  });
}

/** Suspend or restore a vendor: toggles login for the whole business. */
export async function setVendorActive(
  vendorId: string,
  active: boolean
): Promise<ActionResult> {
  return runAction(async () => {
    await requireRole(ROLES.SUPER_ADMIN);

    await dbConnect();
    const vendor = await Vendor.findById(vendorId).select("_id").lean();
    if (!vendor) return { ok: false, error: "Vendor not found." };

    // Affects the owner plus all employee/office logins under this vendor.
    await User.updateMany({ vendor: vendorId }, { $set: { active } });

    revalidatePath("/admin/vendors");
    return { ok: true, message: active ? "Vendor restored." : "Vendor suspended." };
  });
}
