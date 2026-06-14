"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { requireVendor } from "@/lib/guard";
import { assertVendorWritable } from "@/lib/subscription";
import { runAction, type ActionResult } from "@/lib/action-result";
import { User } from "@/models/User";
import { Employee } from "@/models/Employee";
import { hashPassword } from "@/lib/password";
import { ROLES } from "@/lib/roles";

const createSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Enter a name").max(80),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .optional()
    .or(z.literal("")),
});

export async function createEmployee(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const { vendorId } = await requireVendor();
    await assertVendorWritable(vendorId);

    const parsed = createSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { name, email, password, phone } = parsed.data;

    await dbConnect();
    const existing = await User.findOne({ email }).select("_id").lean();
    if (existing) {
      return { ok: false, error: "An account with this email already exists." };
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: ROLES.EMPLOYEE,
      vendor: vendorId,
      active: true,
    });

    try {
      await Employee.create({
        vendor: vendorId,
        user: user._id,
        phone: phone || null,
        active: true,
      });
    } catch (err) {
      await User.deleteOne({ _id: user._id }).catch(() => {});
      throw err;
    }

    revalidatePath("/vendor/employees");
    return { ok: true, message: "Employee added." };
  });
}

export async function updateEmployee(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const { vendorId } = await requireVendor();
    await assertVendorWritable(vendorId);

    const parsed = updateSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { id, name, phone, password } = parsed.data;

    await dbConnect();
    const employee = await Employee.findOne({ _id: id, vendor: vendorId });
    if (!employee) return { ok: false, error: "Employee not found." };

    const update: Record<string, unknown> = { name };
    if (password) update.passwordHash = await hashPassword(password);
    await User.updateOne({ _id: employee.user }, { $set: update });

    employee.phone = phone || null;
    await employee.save();

    revalidatePath("/vendor/employees");
    return { ok: true, message: "Employee updated." };
  });
}

export async function setEmployeeActive(
  id: string,
  active: boolean
): Promise<ActionResult> {
  return runAction(async () => {
    const { vendorId } = await requireVendor();
    await assertVendorWritable(vendorId);

    await dbConnect();
    const employee = await Employee.findOne({ _id: id, vendor: vendorId });
    if (!employee) return { ok: false, error: "Employee not found." };

    employee.active = active;
    await employee.save();
    // Deactivating an employee also blocks their login.
    await User.updateOne({ _id: employee.user }, { $set: { active } });

    revalidatePath("/vendor/employees");
    return { ok: true, message: active ? "Employee activated." : "Employee deactivated." };
  });
}

export async function deleteEmployee(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const { vendorId } = await requireVendor();
    await assertVendorWritable(vendorId);

    await dbConnect();
    const employee = await Employee.findOne({ _id: id, vendor: vendorId });
    if (!employee) return { ok: false, error: "Employee not found." };

    await Employee.deleteOne({ _id: employee._id });
    await User.deleteOne({ _id: employee.user });

    revalidatePath("/vendor/employees");
    return { ok: true, message: "Employee removed." };
  });
}
