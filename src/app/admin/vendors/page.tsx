import { requireRole } from "@/lib/guard";
import { ROLES } from "@/lib/roles";
import { dbConnect } from "@/lib/db";
import { Vendor } from "@/models/Vendor";
import { Subscription } from "@/models/Subscription";
import { Office } from "@/models/Office";
import { Employee } from "@/models/Employee";
import "@/models/User";
import { computeSubscriptionState } from "@/lib/subscription";
import { formatDateKey } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VendorActions } from "./vendor-actions";

const STATUS_BADGE = {
  trialing: { variant: "default" as const, label: "Trial" },
  active: { variant: "success" as const, label: "Active" },
  expired: { variant: "error" as const, label: "Expired" },
};

export default async function AdminVendorsPage() {
  await requireRole(ROLES.SUPER_ADMIN);

  await dbConnect();
  const [vendors, subs, officeAgg, empAgg] = await Promise.all([
    Vendor.find({})
      .populate<{ owner: { email: string; active: boolean } }>("owner", "email active")
      .sort({ createdAt: -1 })
      .lean(),
    Subscription.find({}).select("vendor status trialEndsAt").lean(),
    Office.aggregate<{ _id: unknown; n: number }>([{ $group: { _id: "$vendor", n: { $sum: 1 } } }]),
    Employee.aggregate<{ _id: unknown; n: number }>([{ $group: { _id: "$vendor", n: { $sum: 1 } } }]),
  ]);

  const subByVendor = new Map(subs.map((s) => [String(s.vendor), s]));
  const officeByVendor = new Map(officeAgg.map((a) => [String(a._id), a.n]));
  const empByVendor = new Map(empAgg.map((a) => [String(a._id), a.n]));

  const rows = vendors.map((v) => {
    const id = String(v._id);
    const sub = subByVendor.get(id);
    const state = sub ? computeSubscriptionState(sub) : null;
    return {
      id,
      business: v.businessName,
      ownerEmail: v.owner?.email ?? "—",
      suspended: v.owner ? !v.owner.active : false,
      status: state?.effectiveStatus ?? "expired",
      trialEnds: sub ? formatDateKey(new Date(sub.trialEndsAt).toISOString().slice(0, 10)) : "—",
      daysRemaining: state?.daysRemaining ?? 0,
      offices: officeByVendor.get(id) ?? 0,
      employees: empByVendor.get(id) ?? 0,
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Vendors</h1>
      <p className="mt-1 text-text-muted">All vendor accounts on the platform.</p>

      <Card className="mt-6">
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-text-muted">
            No vendors have signed up yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trial ends</TableHead>
                <TableHead className="text-right">Offices</TableHead>
                <TableHead className="text-right">Staff</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const badge = STATUS_BADGE[r.status];
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.business}
                      {r.suspended && (
                        <Badge variant="error" className="ml-2">
                          Suspended
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-text-muted">{r.ownerEmail}</TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      {r.status === "trialing" && (
                        <span className="ml-2 text-xs text-text-muted">
                          {r.daysRemaining}d left
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-text-muted">{r.trialEnds}</TableCell>
                    <TableCell className="text-right">{r.offices}</TableCell>
                    <TableCell className="text-right">{r.employees}</TableCell>
                    <TableCell className="text-right">
                      <VendorActions
                        vendor={{
                          id: r.id,
                          business: r.business,
                          status: r.status,
                          suspended: r.suspended,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
