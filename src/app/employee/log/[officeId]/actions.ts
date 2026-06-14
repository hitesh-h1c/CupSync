"use server";

import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { assertVendorWritable } from "@/lib/subscription";
import { runAction, type ActionResult } from "@/lib/action-result";
import { Employee } from "@/models/Employee";
import { Office } from "@/models/Office";
import { Assignment } from "@/models/Assignment";
import { Delivery } from "@/models/Delivery";
import { getEffectiveRates } from "@/lib/pricing";
import { istDateKey } from "@/lib/date";
import { round2 } from "@/lib/money";

export type LogItemInput = { productId: string; quantity: number };

/**
 * Log (or update) today's delivery for an assigned office. The unit price for
 * each item is SNAPSHOTTED from the office's effective rate today, so the
 * delivery permanently carries the price that was active on its date.
 */
export async function logDelivery(
  officeId: string,
  items: LogItemInput[]
): Promise<ActionResult> {
  return runAction(async () => {
    const session = await requireRole("employee");
    const vendorId = session.user.vendorId;
    if (!vendorId) return { ok: false, error: "No vendor on session." };
    await assertVendorWritable(vendorId);

    await dbConnect();
    const employee = await Employee.findOne({ user: session.user.id, vendor: vendorId })
      .select("_id active")
      .lean();
    if (!employee || !employee.active) {
      return { ok: false, error: "Your account is not active." };
    }

    // Must be assigned to this office (and the office must belong to the vendor).
    const [office, assignment] = await Promise.all([
      Office.findOne({ _id: officeId, vendor: vendorId, active: true }).select("_id").lean(),
      Assignment.findOne({ employee: employee._id, office: officeId, vendor: vendorId })
        .select("_id")
        .lean(),
    ]);
    if (!office || !assignment) {
      return { ok: false, error: "You are not assigned to this office." };
    }

    const dateKey = istDateKey();
    const rates = await getEffectiveRates(officeId, dateKey);

    const lineItems: { product: string; quantity: number; unitPrice: number }[] = [];
    let total = 0;
    for (const item of items) {
      const qty = Math.trunc(Number(item.quantity));
      if (!Number.isFinite(qty) || qty <= 0) continue; // skip empties
      const price = rates.get(item.productId);
      if (price === undefined) {
        return {
          ok: false,
          error: "Some items don't have a price set for this office yet.",
        };
      }
      lineItems.push({ product: item.productId, quantity: qty, unitPrice: price });
      total = round2(total + round2(qty * price));
    }

    if (lineItems.length === 0) {
      return { ok: false, error: "Enter a quantity for at least one item." };
    }

    // One delivery per office per day — logging again replaces today's entry.
    await Delivery.findOneAndUpdate(
      { office: officeId, dateKey },
      {
        $set: {
          vendor: vendorId,
          office: officeId,
          employee: employee._id,
          date: new Date(),
          dateKey,
          items: lineItems,
          total,
        },
      },
      { upsert: true, new: true }
    );

    revalidatePath("/employee");
    revalidatePath(`/employee/log/${officeId}`);
    return { ok: true, message: "Delivery logged." };
  });
}
