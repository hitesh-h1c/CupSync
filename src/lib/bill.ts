import { dbConnect } from "@/lib/db";
import { Vendor } from "@/models/Vendor";
import { Office } from "@/models/Office";
import { getOfficeMonthSummary } from "@/lib/delivery-summary";
import { formatMonth, formatDateKey, weekdayOf } from "@/lib/date";

export interface BillData {
  business: string;
  office: { name: string; address: string | null; contactPerson: string | null };
  monthKey: string;
  monthLabel: string;
  productLines: { name: string; unit: string; quantity: number; amount: number }[];
  days: {
    date: string;
    weekday: string;
    items: { name: string; quantity: number; unitPrice: number; lineTotal: number }[];
    dayTotal: number;
  }[];
  totals: { deliveryDays: number; cups: number; amount: number };
}

/** Assemble a vendor's monthly bill for one office, or null if not found. */
export async function getOfficeBill(
  vendorId: string,
  officeId: string,
  monthKey: string
): Promise<BillData | null> {
  await dbConnect();
  const [vendor, office] = await Promise.all([
    Vendor.findById(vendorId).select("businessName").lean(),
    Office.findOne({ _id: officeId, vendor: vendorId })
      .select("name address contactPerson")
      .lean(),
  ]);
  if (!office) return null;

  const summary = await getOfficeMonthSummary(officeId, monthKey);

  return {
    business: vendor?.businessName ?? "Cup Sync",
    office: {
      name: office.name,
      address: office.address ?? null,
      contactPerson: office.contactPerson ?? null,
    },
    monthKey,
    monthLabel: formatMonth(monthKey),
    productLines: summary.productTotals.map((p) => ({
      name: p.name,
      unit: p.unit,
      quantity: p.quantity,
      amount: p.amount,
    })),
    days: summary.days
      .slice()
      .reverse() // chronological for the bill detail
      .map((d) => ({
        date: formatDateKey(d.dateKey),
        weekday: weekdayOf(d.dateKey),
        items: d.lines.map((l) => ({
          name: l.name,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          lineTotal: l.lineTotal,
        })),
        dayTotal: d.dayTotal,
      })),
    totals: summary.totals,
  };
}
