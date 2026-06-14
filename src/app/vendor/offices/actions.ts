"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { requireVendor } from "@/lib/guard";
import { assertVendorWritable } from "@/lib/subscription";
import { runAction, type ActionResult } from "@/lib/action-result";
import { User } from "@/models/User";
import { Office } from "@/models/Office";
import { hashPassword } from "@/lib/password";
import { ROLES } from "@/lib/roles";

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid contact email")
  .optional()
  .or(z.literal(""));

const createSchema = z.object({
  name: z.string().trim().min(2, "Enter an office name").max(120),
  loginEmail: z.string().trim().toLowerCase().email("Enter a valid login email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  contactPerson: z.string().trim().max(80).optional().or(z.literal("")),
  contactEmail: optionalEmail,
  dailyEmailEnabled: z.union([z.literal("true"), z.literal("false")]),
});

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Enter an office name").max(120),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  contactPerson: z.string().trim().max(80).optional().or(z.literal("")),
  contactEmail: optionalEmail,
  dailyEmailEnabled: z.union([z.literal("true"), z.literal("false")]),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .optional()
    .or(z.literal("")),
});

export async function createOffice(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const { vendorId } = await requireVendor();
    await assertVendorWritable(vendorId);

    const parsed = createSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { name, loginEmail, password, address, contactPerson, contactEmail, dailyEmailEnabled } =
      parsed.data;

    await dbConnect();
    const existing = await User.findOne({ email: loginEmail }).select("_id").lean();
    if (existing) {
      return { ok: false, error: "An account with this login email already exists." };
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email: loginEmail,
      passwordHash,
      role: ROLES.OFFICE,
      vendor: vendorId,
      active: true,
    });

    try {
      const office = await Office.create({
        vendor: vendorId,
        name,
        address: address || null,
        contactPerson: contactPerson || null,
        contactEmail: contactEmail || null,
        user: user._id,
        dailyEmailEnabled: dailyEmailEnabled === "true",
        active: true,
      });
      // Link the office login user back to its office.
      await User.updateOne({ _id: user._id }, { $set: { office: office._id } });
    } catch (err) {
      await User.deleteOne({ _id: user._id }).catch(() => {});
      throw err;
    }

    revalidatePath("/vendor/offices");
    return { ok: true, message: "Office added." };
  });
}

export async function updateOffice(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const { vendorId } = await requireVendor();
    await assertVendorWritable(vendorId);

    const parsed = updateSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { id, name, address, contactPerson, contactEmail, dailyEmailEnabled, password } =
      parsed.data;

    await dbConnect();
    const office = await Office.findOne({ _id: id, vendor: vendorId });
    if (!office) return { ok: false, error: "Office not found." };

    office.name = name;
    office.address = address || null;
    office.contactPerson = contactPerson || null;
    office.contactEmail = contactEmail || null;
    office.dailyEmailEnabled = dailyEmailEnabled === "true";
    await office.save();

    const userUpdate: Record<string, unknown> = { name };
    if (password) userUpdate.passwordHash = await hashPassword(password);
    await User.updateOne({ _id: office.user }, { $set: userUpdate });

    revalidatePath("/vendor/offices");
    return { ok: true, message: "Office updated." };
  });
}

export async function setOfficeActive(id: string, active: boolean): Promise<ActionResult> {
  return runAction(async () => {
    const { vendorId } = await requireVendor();
    await assertVendorWritable(vendorId);

    await dbConnect();
    const office = await Office.findOne({ _id: id, vendor: vendorId });
    if (!office) return { ok: false, error: "Office not found." };

    office.active = active;
    await office.save();
    await User.updateOne({ _id: office.user }, { $set: { active } });

    revalidatePath("/vendor/offices");
    return { ok: true, message: active ? "Office activated." : "Office deactivated." };
  });
}

export async function deleteOffice(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const { vendorId } = await requireVendor();
    await assertVendorWritable(vendorId);

    await dbConnect();
    const office = await Office.findOne({ _id: id, vendor: vendorId });
    if (!office) return { ok: false, error: "Office not found." };

    await Office.deleteOne({ _id: office._id });
    await User.deleteOne({ _id: office.user });

    revalidatePath("/vendor/offices");
    return { ok: true, message: "Office removed." };
  });
}
