import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/guard";
import { ROLES } from "@/lib/roles";
import { dbConnect } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { Office } from "@/models/Office";
import { Assignment } from "@/models/Assignment";
import { Product } from "@/models/Product";
import { Delivery } from "@/models/Delivery";
import { getEffectiveRates } from "@/lib/pricing";
import { getVendorSubscriptionState } from "@/lib/subscription";
import { istDateKey, formatDateKey } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { LogForm } from "./log-form";

export default async function LogDeliveryPage({
  params,
}: {
  params: Promise<{ officeId: string }>;
}) {
  const { officeId } = await params;
  const session = await requireRole(ROLES.EMPLOYEE);
  const vendorId = session.user.vendorId;
  if (!vendorId) notFound();

  await dbConnect();
  const employee = await Employee.findOne({ user: session.user.id, vendor: vendorId })
    .select("_id")
    .lean();
  if (!employee) notFound();

  const [office, assignment] = await Promise.all([
    Office.findOne({ _id: officeId, vendor: vendorId, active: true }).select("name").lean(),
    Assignment.findOne({ employee: employee._id, office: officeId, vendor: vendorId })
      .select("_id")
      .lean(),
  ]);
  if (!office || !assignment) notFound();

  const todayKey = istDateKey();
  const [products, rates, existing, state] = await Promise.all([
    Product.find({ vendor: vendorId, active: true }).sort({ name: 1 }).lean(),
    getEffectiveRates(officeId, todayKey),
    Delivery.findOne({ office: officeId, dateKey: todayKey }).select("items").lean(),
    getVendorSubscriptionState(vendorId),
  ]);
  const readOnly = state?.readOnly ?? false;

  // Only products that have a price set for this office today can be logged.
  const loggable = products
    .filter((p) => rates.has(String(p._id)))
    .map((p) => ({ id: String(p._id), name: p.name, unit: p.unit }));

  const existingQty: Record<string, number> = {};
  for (const it of existing?.items ?? []) {
    existingQty[String(it.product)] = it.quantity;
  }

  return (
    <div>
      <Link
        href="/employee"
        className="mb-3 inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-xl font-bold">{office.name}</h1>
      <p className="mt-1 text-sm text-text-muted">{formatDateKey(todayKey)}</p>

      {readOnly ? (
        <Card className="mt-5 border-error/30 bg-error/10 p-4 text-sm text-error">
          This account is view-only. Ask your vendor to renew their subscription
          to log deliveries.
        </Card>
      ) : loggable.length === 0 ? (
        <Card className="mt-5 p-6 text-center text-sm text-text-muted">
          No priced products for this office yet. Ask your vendor to set prices.
        </Card>
      ) : (
        <LogForm
          officeId={officeId}
          products={loggable}
          initialQty={existingQty}
          alreadyLogged={!!existing}
        />
      )}
    </div>
  );
}
