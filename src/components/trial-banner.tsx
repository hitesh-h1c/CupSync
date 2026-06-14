import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SubscriptionState } from "@/lib/subscription";

/**
 * Surfaces the vendor's subscription state at the top of their dashboard:
 * trial countdown, an end-of-trial warning, or the read-only expired wall.
 */
export function TrialBanner({ state }: { state: SubscriptionState | null }) {
  if (!state || state.effectiveStatus === "active") return null;

  if (state.effectiveStatus === "expired") {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-error">
          Your free trial has ended. Your data is safe, but Cup Sync is now
          view-only until you upgrade.
        </span>
        <Link
          href="/vendor/billing"
          className="shrink-0 font-medium text-error underline underline-offset-4"
        >
          Upgrade
        </Link>
      </div>
    );
  }

  // trialing
  const ending = state.daysRemaining <= 3;
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
        ending
          ? "border-warning/40 bg-warning/10"
          : "border-primary/20 bg-primary/10"
      )}
    >
      <span className={cn("font-medium", ending ? "text-warning" : "text-primary-dark")}>
        {state.daysRemaining === 1
          ? "1 day left in your free trial"
          : `${state.daysRemaining} days left in your free trial`}
      </span>
      <Link
        href="/vendor/billing"
        className={cn(
          "shrink-0 font-medium underline underline-offset-4",
          ending ? "text-warning" : "text-primary-dark"
        )}
      >
        Upgrade
      </Link>
    </div>
  );
}
