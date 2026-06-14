import Link from "next/link";
import { requireVendor } from "@/lib/guard";
import { getVendorSubscriptionState } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  trialing: "Free trial",
  active: "Active plan",
  expired: "Trial ended",
};

export default async function BillingPage() {
  const { vendorId } = await requireVendor();
  const state = await getVendorSubscriptionState(vendorId);

  return (
    <div>
      <h1 className="text-2xl font-bold">Subscription</h1>

      <Card className="mt-6 max-w-lg">
        <CardHeader>
          <CardTitle>
            {state ? STATUS_LABEL[state.effectiveStatus] : "No subscription"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {state?.effectiveStatus === "trialing" && (
            <p className="text-text-muted">
              You have <strong>{state.daysRemaining}</strong> day
              {state.daysRemaining === 1 ? "" : "s"} left in your free trial.
            </p>
          )}
          {state?.effectiveStatus === "expired" && (
            <p className="text-error">
              Your trial has ended. Cup Sync is view-only until you upgrade.
            </p>
          )}
          {state?.effectiveStatus === "active" && (
            <p className="text-success">Your plan is active. Thank you!</p>
          )}

          <p className="text-text-muted">
            Online plan upgrades are coming soon. For now, contact us to activate
            a plan — a Super Admin can enable it for your account.
          </p>

          <div className="flex gap-2 pt-2">
            <Button disabled>Upgrade (coming soon)</Button>
            <Button asChild variant="outline">
              <Link href="/vendor">Back to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
