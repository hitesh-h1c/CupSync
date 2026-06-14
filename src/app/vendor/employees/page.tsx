import { Plus, Users } from "lucide-react";
import { requireVendor } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { Office } from "@/models/Office";
import { Assignment } from "@/models/Assignment";
import "@/models/User"; // ensure User schema is registered for populate
import { getVendorSubscriptionState } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmployeeDialog } from "./employee-dialog";
import { EmployeeRowActions } from "./employee-row-actions";
import { AssignmentDialog } from "./assignment-dialog";

type PopulatedUser = { name: string; email: string; active: boolean };

export default async function EmployeesPage() {
  const { vendorId } = await requireVendor();

  await dbConnect();
  const [docs, offices, assignments, state] = await Promise.all([
    Employee.find({ vendor: vendorId })
      .populate<{ user: PopulatedUser }>("user", "name email active")
      .sort({ createdAt: -1 })
      .lean(),
    Office.find({ vendor: vendorId, active: true }).select("name").sort({ name: 1 }).lean(),
    Assignment.find({ vendor: vendorId }).select("employee office").lean(),
    getVendorSubscriptionState(vendorId),
  ]);

  const readOnly = state?.readOnly ?? false;

  const officeOptions = offices.map((o) => ({ id: String(o._id), name: o.name }));

  // employeeId → [officeId]
  const assignedByEmployee = new Map<string, string[]>();
  for (const a of assignments) {
    const key = String(a.employee);
    const list = assignedByEmployee.get(key) ?? [];
    list.push(String(a.office));
    assignedByEmployee.set(key, list);
  }

  const employees = docs.map((d) => ({
    id: String(d._id),
    name: d.user?.name ?? "—",
    email: d.user?.email ?? "—",
    phone: d.phone ?? "",
    active: d.active,
    assignedIds: assignedByEmployee.get(String(d._id)) ?? [],
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="mt-1 text-text-muted">
            Delivery staff who log daily deliveries.
          </p>
        </div>
        {!readOnly && (
          <EmployeeDialog
            mode="create"
            trigger={
              <Button>
                <Plus /> Add employee
              </Button>
            }
          />
        )}
      </div>

      <Card className="mt-6">
        {employees.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="rounded-full bg-background p-3">
              <Users className="h-6 w-6 text-text-muted" />
            </div>
            <p className="font-medium">No employees yet</p>
            <p className="max-w-xs text-sm text-text-muted">
              Add your delivery staff so they can start logging deliveries.
            </p>
            {!readOnly && (
              <EmployeeDialog
                mode="create"
                trigger={
                  <Button variant="outline">
                    <Plus /> Add your first employee
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Offices</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell className="text-text-muted">{emp.email}</TableCell>
                  <TableCell className="text-text-muted">{emp.phone || "—"}</TableCell>
                  <TableCell>
                    <AssignmentDialog
                      employeeId={emp.id}
                      employeeName={emp.name}
                      offices={officeOptions}
                      assignedIds={emp.assignedIds}
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={emp.active ? "success" : "muted"}>
                      {emp.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <EmployeeRowActions
                      employee={{
                        id: emp.id,
                        name: emp.name,
                        email: emp.email,
                        phone: emp.phone,
                      }}
                      active={emp.active}
                      disabled={readOnly}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
