import { cache } from "react";
import { dbConnect } from "@/lib/db";
import { Subscription, type ISubscription } from "@/models/Subscription";
import { AuthError } from "@/lib/guard";

export const TRIAL_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export type EffectiveStatus = "trialing" | "active" | "expired";

export interface SubscriptionState {
  /** Stored status from the DB. */
  status: string;
  /** Status after evaluating the trial clock — what gating decisions use. */
  effectiveStatus: EffectiveStatus;
  /**
   * When true, the vendor (and their offices/employees) may read existing data
   * but may not create or edit anything until a plan is active.
   */
  readOnly: boolean;
  /** Whole days left in the trial; 0 for active/expired. */
  daysRemaining: number;
  trialEndsAt: Date | null;
}

/** Pure: derive the effective state from a subscription record + the clock. */
export function computeSubscriptionState(
  sub: Pick<ISubscription, "status" | "trialEndsAt">,
  now: number = Date.now()
): SubscriptionState {
  if (sub.status === "active") {
    return {
      status: "active",
      effectiveStatus: "active",
      readOnly: false,
      daysRemaining: 0,
      trialEndsAt: sub.trialEndsAt ?? null,
    };
  }

  const endsAt = sub.trialEndsAt ? new Date(sub.trialEndsAt).getTime() : 0;
  const stillTrialing = sub.status === "trialing" && now < endsAt;

  if (stillTrialing) {
    return {
      status: "trialing",
      effectiveStatus: "trialing",
      readOnly: false,
      daysRemaining: Math.max(0, Math.ceil((endsAt - now) / DAY_MS)),
      trialEndsAt: sub.trialEndsAt,
    };
  }

  // status === 'expired', or a trial whose clock has run out.
  return {
    status: sub.status,
    effectiveStatus: "expired",
    readOnly: true,
    daysRemaining: 0,
    trialEndsAt: sub.trialEndsAt ?? null,
  };
}

/**
 * Load a vendor's subscription and compute its effective state.
 * Wrapped in React `cache()` so the layout and page in the same request share
 * a single DB query instead of each fetching it.
 */
export const getVendorSubscriptionState = cache(
  async (vendorId: string): Promise<SubscriptionState | null> => {
    await dbConnect();
    const sub = await Subscription.findOne({ vendor: vendorId })
      .select("status trialEndsAt")
      .lean();
    if (!sub) return null;
    return computeSubscriptionState(sub);
  }
);

/**
 * Mutation guard. Call at the top of any create/edit/delete action scoped to a
 * vendor. Throws when the vendor is read-only (trial expired, no active plan).
 * This is the single enforcement point for the "read-only on expiry" rule.
 */
export async function assertVendorWritable(vendorId: string): Promise<void> {
  const state = await getVendorSubscriptionState(vendorId);
  if (!state) {
    throw new AuthError("No active subscription", 403);
  }
  if (state.readOnly) {
    throw new AuthError(
      "Your free trial has ended. Upgrade to a plan to make changes.",
      402
    );
  }
}
