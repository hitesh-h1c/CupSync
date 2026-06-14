"use server";

import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { requireVendor } from "@/lib/guard";
import { assertVendorWritable } from "@/lib/subscription";
import { runAction, type ActionResult } from "@/lib/action-result";
import { Employee } from "@/models/Employee";
import { Office } from "@/models/Office";
import { Assignment } from "@/models/Assignment";

/** Replace an employee's office assignments with the given set. */
export async function setEmployeeAssignments(
  employeeId: string,
  officeIds: string[]
): Promise<ActionResult> {
  return runAction(async () => {
    const { vendorId } = await requireVendor();
    await assertVendorWritable(vendorId);

    await dbConnect();
    const employee = await Employee.findOne({ _id: employeeId, vendor: vendorId })
      .select("_id")
      .lean();
    if (!employee) return { ok: false, error: "Employee not found." };

    // Keep only offices that actually belong to this vendor.
    const validOffices = await Office.find({
      _id: { $in: officeIds },
      vendor: vendorId,
    })
      .select("_id")
      .lean();
    const validIds = new Set(validOffices.map((o) => String(o._id)));

    const current = await Assignment.find({ employee: employeeId, vendor: vendorId })
      .select("office")
      .lean();
    const currentIds = new Set(current.map((a) => String(a.office)));

    const toAdd = [...validIds].filter((id) => !currentIds.has(id));
    const toRemove = [...currentIds].filter((id) => !validIds.has(id));

    if (toRemove.length) {
      await Assignment.deleteMany({
        employee: employeeId,
        vendor: vendorId,
        office: { $in: toRemove },
      });
    }
    if (toAdd.length) {
      await Assignment.insertMany(
        toAdd.map((office) => ({ vendor: vendorId, employee: employeeId, office }))
      );
    }

    revalidatePath("/vendor/employees");
    return { ok: true, message: "Assignments updated." };
  });
}
