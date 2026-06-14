import { dbConnect } from "@/lib/db";
import { OfficeRate } from "@/models/OfficeRate";
import { dateKeyToUTCDate } from "@/lib/date";

/**
 * The effective unit price for one product at an office on a given calendar day
 * (the latest rate whose `effectiveFrom` is on or before that day), or null if
 * no rate has been set yet.
 */
export async function getEffectiveRate(
  officeId: string,
  productId: string,
  dateKey: string
): Promise<number | null> {
  await dbConnect();
  const cutoff = dateKeyToUTCDate(dateKey);
  const rate = await OfficeRate.findOne({
    office: officeId,
    product: productId,
    effectiveFrom: { $lte: cutoff },
  })
    .sort({ effectiveFrom: -1 })
    .select("price")
    .lean();
  return rate ? rate.price : null;
}

/**
 * Effective prices for ALL products at an office on a given day, as a
 * productId → price map. Used by the delivery-logging screen to know which
 * products are priced, and to snapshot prices at submit time.
 */
export async function getEffectiveRates(
  officeId: string,
  dateKey: string
): Promise<Map<string, number>> {
  await dbConnect();
  const cutoff = dateKeyToUTCDate(dateKey);
  const rates = await OfficeRate.find({
    office: officeId,
    effectiveFrom: { $lte: cutoff },
  })
    .sort({ effectiveFrom: -1 })
    .select("product price")
    .lean();

  const map = new Map<string, number>();
  for (const r of rates) {
    const key = String(r.product);
    // First seen wins because the list is sorted newest-effective first.
    if (!map.has(key)) map.set(key, r.price);
  }
  return map;
}
