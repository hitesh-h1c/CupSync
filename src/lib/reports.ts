import { dbConnect } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { Product } from "@/models/Product";
import { Office } from "@/models/Office";
import { Employee } from "@/models/Employee";
import "@/models/User";
import { round2 } from "@/lib/money";

export interface ReportFilters {
  vendor: string;
  office?: string;
  employee?: string;
  from?: string; // YYYY-MM-DD inclusive
  to?: string; // YYYY-MM-DD inclusive
}

export interface ReportRow {
  id: string;
  dateKey: string;
  officeName: string;
  employeeName: string;
  items: { name: string; quantity: number; unitPrice: number; lineTotal: number }[];
  cups: number;
  total: number;
}

export interface DeliveryReport {
  rows: ReportRow[]; // most recent first
  totals: { deliveries: number; cups: number; amount: number };
  productTotals: { name: string; quantity: number; amount: number }[];
}

/**
 * Vendor-scoped delivery report. Amounts use the snapshotted `unitPrice` on
 * each delivery line, so they always reflect the price active that day.
 */
export async function getDeliveryReport(filters: ReportFilters): Promise<DeliveryReport> {
  await dbConnect();

  const query: Record<string, unknown> = { vendor: filters.vendor };
  if (filters.office) query.office = filters.office;
  if (filters.employee) query.employee = filters.employee;
  if (filters.from || filters.to) {
    const range: Record<string, string> = {};
    if (filters.from) range.$gte = filters.from;
    if (filters.to) range.$lte = filters.to;
    query.dateKey = range;
  }

  const deliveries = await Delivery.find(query).sort({ dateKey: -1 }).lean();

  // Resolve names for products / offices / employees referenced.
  const productIds = new Set<string>();
  const officeIds = new Set<string>();
  const employeeIds = new Set<string>();
  for (const d of deliveries) {
    officeIds.add(String(d.office));
    employeeIds.add(String(d.employee));
    for (const it of d.items) productIds.add(String(it.product));
  }

  const [products, offices, employees] = await Promise.all([
    Product.find({ _id: { $in: [...productIds] } }).select("name").lean(),
    Office.find({ _id: { $in: [...officeIds] } }).select("name").lean(),
    Employee.find({ _id: { $in: [...employeeIds] } })
      .populate<{ user: { name: string } }>("user", "name")
      .select("user")
      .lean(),
  ]);
  const productName = new Map(products.map((p) => [String(p._id), p.name]));
  const officeName = new Map(offices.map((o) => [String(o._id), o.name]));
  const employeeName = new Map(
    employees.map((e) => [String(e._id), e.user?.name ?? "—"])
  );

  const productAgg = new Map<string, { quantity: number; amount: number }>();
  let totalCups = 0;
  let totalAmount = 0;

  const rows: ReportRow[] = deliveries.map((d) => {
    let cups = 0;
    let total = 0;
    const items = d.items.map((it) => {
      const pid = String(it.product);
      const name = productName.get(pid) ?? "Unknown";
      const lineTotal = round2(it.quantity * it.unitPrice);
      cups += it.quantity;
      total = round2(total + lineTotal);
      const agg = productAgg.get(name) ?? { quantity: 0, amount: 0 };
      agg.quantity += it.quantity;
      agg.amount = round2(agg.amount + lineTotal);
      productAgg.set(name, agg);
      return { name, quantity: it.quantity, unitPrice: it.unitPrice, lineTotal };
    });
    totalCups += cups;
    totalAmount = round2(totalAmount + total);
    return {
      id: String(d._id),
      dateKey: d.dateKey,
      officeName: officeName.get(String(d.office)) ?? "—",
      employeeName: employeeName.get(String(d.employee)) ?? "—",
      items,
      cups,
      total,
    };
  });

  const productTotals = [...productAgg.entries()]
    .map(([name, agg]) => ({ name, quantity: agg.quantity, amount: agg.amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    rows,
    totals: { deliveries: deliveries.length, cups: totalCups, amount: totalAmount },
    productTotals,
  };
}
