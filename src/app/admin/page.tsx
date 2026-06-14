import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { ROLES } from "@/lib/roles";
import { dbConnect } from "@/lib/db";
import { Vendor } from "@/models/Vendor";
import { Subscription } from "@/models/Subscription";
import { Office } from "@/models/Office";
import { Employee } from "@/models/Employee";
import { Delivery } from "@/models/Delivery";
import { computeSubscriptionState } from "@/lib/subscription";
import { istDateKey } from "@/lib/date";
import { Card, CardContent } from "@/components/ui/card";

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-text-muted">{label}</p>
        <p className="mt-1 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function AdminOverview() {
  await requireRole(ROLES.SUPER_ADMIN);

  await dbConnect();
  const [vendorCount, subs, officeCount, employeeCount, deliveryCount, todayCount] =
    await Promise.all([
      Vendor.countDocuments({}),
      Subscription.find({}).select("status trialEndsAt").lean(),
      Office.countDocuments({}),
      Employee.countDocuments({}),
      Delivery.countDocuments({}),
      Delivery.countDocuments({ dateKey: istDateKey() }),
    ]);

  const counts = { trialing: 0, active: 0, expired: 0 };
  for (const s of subs) {
    const state = computeSubscriptionState(s);
    counts[state.effectiveStatus]++;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Platform overview</h1>
        <Link
          href="/admin/vendors"
          className="text-sm font-medium text-primary hover:underline"
        >
          Manage vendors →
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Vendors" value={vendorCount} />
        <Metric label="On trial" value={counts.trialing} />
        <Metric label="Active plans" value={counts.active} />
        <Metric label="Expired" value={counts.expired} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Offices" value={officeCount} />
        <Metric label="Employees" value={employeeCount} />
        <Metric label="Deliveries (all time)" value={deliveryCount} />
        <Metric label="Deliveries today" value={todayCount} />
      </div>
    </div>
  );
}
