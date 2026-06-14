"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { requireVendor } from "@/lib/guard";
import { assertVendorWritable } from "@/lib/subscription";
import { runAction, type ActionResult } from "@/lib/action-result";
import { Product } from "@/models/Product";

const createSchema = z.object({
  name: z.string().trim().min(1, "Enter a product name").max(80),
  unit: z.string().trim().min(1).max(20).default("cup"),
});

const updateSchema = createSchema.extend({ id: z.string().min(1) });

export async function createProduct(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const { vendorId } = await requireVendor();
    await assertVendorWritable(vendorId);

    const parsed = createSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    await dbConnect();
    await Product.create({ vendor: vendorId, ...parsed.data, active: true });

    revalidatePath("/vendor/products");
    return { ok: true, message: "Product added." };
  });
}

export async function updateProduct(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const { vendorId } = await requireVendor();
    await assertVendorWritable(vendorId);

    const parsed = updateSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { id, name, unit } = parsed.data;

    await dbConnect();
    const res = await Product.updateOne(
      { _id: id, vendor: vendorId },
      { $set: { name, unit } }
    );
    if (res.matchedCount === 0) return { ok: false, error: "Product not found." };

    revalidatePath("/vendor/products");
    return { ok: true, message: "Product updated." };
  });
}

export async function setProductActive(id: string, active: boolean): Promise<ActionResult> {
  return runAction(async () => {
    const { vendorId } = await requireVendor();
    await assertVendorWritable(vendorId);

    await dbConnect();
    const res = await Product.updateOne({ _id: id, vendor: vendorId }, { $set: { active } });
    if (res.matchedCount === 0) return { ok: false, error: "Product not found." };

    revalidatePath("/vendor/products");
    return { ok: true, message: active ? "Product activated." : "Product deactivated." };
  });
}
