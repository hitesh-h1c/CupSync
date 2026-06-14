"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { requireVendor } from "@/lib/guard";
import { assertVendorWritable } from "@/lib/subscription";
import { runAction, type ActionResult } from "@/lib/action-result";
import { Office } from "@/models/Office";
import { Product } from "@/models/Product";
import { OfficeRate } from "@/models/OfficeRate";
import { dateKeyToUTCDate, isValidDateKey } from "@/lib/date";

const schema = z.object({
  officeId: z.string().min(1),
  productId: z.string().min(1),
  price: z.coerce.number().min(0, "Price can't be negative").max(100000),
  effectiveFrom: z.string().refine(isValidDateKey, "Enter a valid date"),
});

/**
 * Set a product's price for an office, effective from a date. This NEVER
 * overwrites past rates — it inserts a new dated row (or updates the row for
 * that exact day if you re-set the same date), preserving full price history.
 */
export async function setOfficeRate(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const { vendorId } = await requireVendor();
    await assertVendorWritable(vendorId);

    const parsed = schema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { officeId, productId, price, effectiveFrom } = parsed.data;

    await dbConnect();
    // Verify both office and product belong to this vendor.
    const [office, product] = await Promise.all([
      Office.findOne({ _id: officeId, vendor: vendorId }).select("_id").lean(),
      Product.findOne({ _id: productId, vendor: vendorId }).select("_id").lean(),
    ]);
    if (!office || !product) return { ok: false, error: "Office or product not found." };

    const effectiveDate = dateKeyToUTCDate(effectiveFrom);
    // Upsert on office+product+day: a new day adds history, same day corrects it.
    await OfficeRate.updateOne(
      { office: officeId, product: productId, effectiveFrom: effectiveDate },
      { $set: { price, vendor: vendorId } },
      { upsert: true }
    );

    revalidatePath(`/vendor/offices/${officeId}/rates`);
    return { ok: true, message: "Price saved." };
  });
}
