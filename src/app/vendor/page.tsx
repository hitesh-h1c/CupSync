import Link from "next/link";
import { requireVendor } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { Office } from "@/models/Office";
import { getVendorSubscriptionState } from "@/lib/subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Metric({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const body = (
    <Card className={href ? "transition-colors hover:border-primary/40" : ""}>
      <CardContent className="p-5">
        <p className="text-sm text-text-muted">{label}</p>
        <p className="mt-1 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function VendorHome() {
  const { vendorId, session } = await requireVendor();

  await dbConnect();
  const [employeeCount, officeCount, state] = await Promise.all([
    Employee.countDocuments({ vendor: vendorId }),
    Office.countDocuments({ vendor: vendorId }),
    getVendorSubscriptionState(vendorId),
  ]);

  const trialLabel =
    state?.effectiveStatus === "trialing"
      ? `${state.daysRemaining} day${state.daysRemaining === 1 ? "" : "s"}`
      : state?.effectiveStatus === "active"
        ? "Active"
        : "Ended";

  return (
    <div>
      <h1 className="text-2xl font-bold">
        Welcome back, {session.user.name?.split(" ")[0]}
      </h1>
      <p className="mt-1 text-text-muted">Here&apos;s your business at a glance.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric label="Employees" value={employeeCount} href="/vendor/employees" />
        <Metric label="Offices" value={officeCount} href="/vendor/offices" />
        <Metric label="Subscription" value={trialLabel} href="/vendor/billing" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Getting started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-text-muted">
          <p>1. Add your delivery employees and client offices.</p>
          <p>2. Define products and per-office rates (coming in Phase 4).</p>
          <p>3. Assign employees to offices, then start logging deliveries.</p>
        </CardContent>
      </Card>
    </div>
  );
}
