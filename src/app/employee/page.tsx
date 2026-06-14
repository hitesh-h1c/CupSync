import Link from "next/link";
import { ChevronRight, Check, Building2 } from "lucide-react";
import { requireRole } from "@/lib/guard";
import { ROLES } from "@/lib/roles";
import { dbConnect } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { Assignment } from "@/models/Assignment";
import { Office } from "@/models/Office";
import { Delivery } from "@/models/Delivery";
import { istDateKey, formatDateKey } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function EmployeeHome() {
  const session = await requireRole(ROLES.EMPLOYEE);
  const vendorId = session.user.vendorId;

  await dbConnect();
  const employee = await Employee.findOne({ user: session.user.id, vendor: vendorId })
    .select("_id")
    .lean();

  const todayKey = istDateKey();

  let offices: { id: string; name: string; loggedToday: boolean }[] = [];
  if (employee) {
    const assignments = await Assignment.find({ employee: employee._id, vendor: vendorId })
      .select("office")
      .lean();
    const officeIds = assignments.map((a) => a.office);

    const [officeDocs, todays] = await Promise.all([
      Office.find({ _id: { $in: officeIds }, active: true }).select("name").sort({ name: 1 }).lean(),
      Delivery.find({ office: { $in: officeIds }, dateKey: todayKey }).select("office").lean(),
    ]);
    const loggedSet = new Set(todays.map((d) => String(d.office)));
    offices = officeDocs.map((o) => ({
      id: String(o._id),
      name: o.name,
      loggedToday: loggedSet.has(String(o._id)),
    }));
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Today&apos;s deliveries</h1>
      <p className="mt-1 text-sm text-text-muted">{formatDateKey(todayKey)}</p>

      {offices.length === 0 ? (
        <Card className="mt-5">
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <div className="rounded-full bg-background p-3">
              <Building2 className="h-6 w-6 text-text-muted" />
            </div>
            <p className="font-medium">No offices assigned</p>
            <p className="max-w-xs text-sm text-text-muted">
              Ask your vendor to assign you to an office to start logging deliveries.
            </p>
          </div>
        </Card>
      ) : (
        <div className="mt-5 space-y-3">
          {offices.map((o) => (
            <Link key={o.id} href={`/employee/log/${o.id}`}>
              <Card className="flex items-center justify-between p-4 transition-colors active:bg-background">
                <div>
                  <p className="font-medium">{o.name}</p>
                  {o.loggedToday ? (
                    <Badge variant="success" className="mt-1">
                      <Check className="mr-1 h-3 w-3" /> Logged today
                    </Badge>
                  ) : (
                    <p className="mt-0.5 text-sm text-text-muted">Tap to log</p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-text-muted" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
