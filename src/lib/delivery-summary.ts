import { dbConnect } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { Product } from "@/models/Product";
import { round2 } from "@/lib/money";

export interface SummaryLine {
  productId: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface DaySummary {
  dateKey: string;
  lines: SummaryLine[];
  dayCups: number;
  dayTotal: number;
}

export interface MonthSummary {
  monthKey: string;
  days: DaySummary[]; // most recent first
  productTotals: { productId: string; name: string; unit: string; quantity: number; amount: number }[];
  totals: { deliveryDays: number; cups: number; amount: number };
}

/**
 * One day's delivery for an office, with product names resolved. Returns null
 * if nothing was delivered that day. Used by the daily summary email.
 */
export async function getOfficeDaySummary(
  officeId: string,
  dateKey: string
): Promise<{ lines: SummaryLine[]; cups: number; total: number } | null> {
  await dbConnect();
  const delivery = await Delivery.findOne({ office: officeId, dateKey }).lean();
  if (!delivery || delivery.items.length === 0) return null;

  const products = await Product.find({
    _id: { $in: delivery.items.map((it) => it.product) },
  })
    .select("name unit")
    .lean();
  const productMap = new Map(
    products.map((p) => [String(p._id), { name: p.name, unit: p.unit }])
  );

  let cups = 0;
  let total = 0;
  const lines: SummaryLine[] = delivery.items.map((it) => {
    const pid = String(it.product);
    const meta = productMap.get(pid) ?? { name: "Unknown", unit: "" };
    const lineTotal = round2(it.quantity * it.unitPrice);
    cups += it.quantity;
    total = round2(total + lineTotal);
    return {
      productId: pid,
      name: meta.name,
      unit: meta.unit,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      lineTotal,
    };
  });

  return { lines, cups, total };
}

/**
 * Build an office's summary for a month from snapshotted delivery line items.
 * Amounts come straight from the stored `unitPrice` on each item — current
 * prices are never re-looked-up, so historical numbers are stable.
 */
export async function getOfficeMonthSummary(
  officeId: string,
  monthKey: string
): Promise<MonthSummary> {
  await dbConnect();

  const deliveries = await Delivery.find({
    office: officeId,
    dateKey: { $regex: `^${monthKey}-` },
  })
    .sort({ dateKey: -1 })
    .lean();

  // Resolve product names (include inactive — they may have been delivered).
  const productIds = new Set<string>();
  for (const d of deliveries) for (const it of d.items) productIds.add(String(it.product));
  const products = await Product.find({ _id: { $in: [...productIds] } })
    .select("name unit")
    .lean();
  const productMap = new Map(
    products.map((p) => [String(p._id), { name: p.name, unit: p.unit }])
  );
  const nameOf = (id: string) => productMap.get(id) ?? { name: "Unknown", unit: "" };

  const days: DaySummary[] = [];
  const productAgg = new Map<string, { quantity: number; amount: number }>();
  let totalCups = 0;
  let totalAmount = 0;

  for (const d of deliveries) {
    const lines: SummaryLine[] = [];
    let dayCups = 0;
    let dayTotal = 0;
    for (const it of d.items) {
      const pid = String(it.product);
      const meta = nameOf(pid);
      const lineTotal = round2(it.quantity * it.unitPrice);
      lines.push({
        productId: pid,
        name: meta.name,
        unit: meta.unit,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal,
      });
      dayCups += it.quantity;
      dayTotal = round2(dayTotal + lineTotal);

      const agg = productAgg.get(pid) ?? { quantity: 0, amount: 0 };
      agg.quantity += it.quantity;
      agg.amount = round2(agg.amount + lineTotal);
      productAgg.set(pid, agg);
    }
    days.push({ dateKey: d.dateKey, lines, dayCups, dayTotal });
    totalCups += dayCups;
    totalAmount = round2(totalAmount + dayTotal);
  }

  const productTotals = [...productAgg.entries()]
    .map(([productId, agg]) => ({
      productId,
      name: nameOf(productId).name,
      unit: nameOf(productId).unit,
      quantity: agg.quantity,
      amount: agg.amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    monthKey,
    days,
    productTotals,
    totals: { deliveryDays: deliveries.length, cups: totalCups, amount: totalAmount },
  };
}
