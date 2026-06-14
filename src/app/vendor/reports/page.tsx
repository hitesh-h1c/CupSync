import { Download, BarChart3 } from "lucide-react";
import { requireVendor } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Office } from "@/models/Office";
import { Employee } from "@/models/Employee";
import "@/models/User";
import { getDeliveryReport } from "@/lib/reports";
import { isValidDateKey, formatDateKey, weekdayOf } from "@/lib/date";
import { formatINR } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SP = { office?: string; employee?: string; from?: string; to?: string };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { vendorId } = await requireVendor();
  const sp = await searchParams;

  const office = sp.office || undefined;
  const employee = sp.employee || undefined;
  const from = sp.from && isValidDateKey(sp.from) ? sp.from : undefined;
  const to = sp.to && isValidDateKey(sp.to) ? sp.to : undefined;

  await dbConnect();
  const [offices, employees, report] = await Promise.all([
    Office.find({ vendor: vendorId }).select("name").sort({ name: 1 }).lean(),
    Employee.find({ vendor: vendorId })
      .populate<{ user: { name: string } }>("user", "name")
      .sort({ createdAt: 1 })
      .lean(),
    getDeliveryReport({ vendor: vendorId, office, employee, from, to }),
  ]);

  const employeeOpts = employees.map((e) => ({
    id: String(e._id),
    name: e.user?.name ?? "—",
  }));

  const csvQuery = new URLSearchParams();
  if (office) csvQuery.set("office", office);
  if (employee) csvQuery.set("employee", employee);
  if (from) csvQuery.set("from", from);
  if (to) csvQuery.set("to", to);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="mt-1 text-text-muted">
            Filter deliveries by office, employee, and date range.
          </p>
        </div>
        {report.totals.deliveries > 0 && (
          <Button asChild variant="outline">
            <a href={`/api/vendor/reports/csv?${csvQuery.toString()}`}>
              <Download /> Export CSV
            </a>
          </Button>
        )}
      </div>

      {/* Filters — plain GET form, no client JS needed */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <form
            method="GET"
            action="/vendor/reports"
            className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-muted">Office</label>
              <select
                name="office"
                defaultValue={office ?? ""}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
              >
                <option value="">All offices</option>
                {offices.map((o) => (
                  <option key={String(o._id)} value={String(o._id)}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-muted">Employee</label>
              <select
                name="employee"
                defaultValue={employee ?? ""}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
              >
                <option value="">All employees</option>
                {employeeOpts.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-muted">From</label>
              <input
                type="date"
                name="from"
                defaultValue={from ?? ""}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-muted">To</label>
              <input
                type="date"
                name="to"
                defaultValue={to ?? ""}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Apply
              </Button>
              <Button asChild variant="outline">
                <a href="/vendor/reports">Reset</a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Deliveries", value: report.totals.deliveries },
          { label: "Total cups", value: report.totals.cups },
          { label: "Total amount", value: formatINR(report.totals.amount) },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5">
              <p className="text-sm text-text-muted">{m.label}</p>
              <p className="mt-1 text-3xl font-bold">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {report.productTotals.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">By product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {report.productTotals.map((p) => (
                <div key={p.name} className="rounded-md bg-background px-4 py-2">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-sm text-text-muted">
                    {p.quantity} · {formatINR(p.amount)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Deliveries</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {report.rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <div className="rounded-full bg-background p-3">
                <BarChart3 className="h-6 w-6 text-text-muted" />
              </div>
              <p className="font-medium">No deliveries match these filters</p>
              <p className="text-sm text-text-muted">
                Try widening the date range or clearing filters.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Office</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-medium">{formatDateKey(r.dateKey)}</div>
                      <div className="text-xs text-text-muted">{weekdayOf(r.dateKey)}</div>
                    </TableCell>
                    <TableCell>{r.officeName}</TableCell>
                    <TableCell className="text-text-muted">{r.employeeName}</TableCell>
                    <TableCell className="text-sm text-text-muted">
                      {r.items
                        .map((it) => `${it.name} ×${it.quantity} (${formatINR(it.unitPrice)})`)
                        .join(", ")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatINR(r.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
