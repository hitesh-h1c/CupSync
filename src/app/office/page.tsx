import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { requireRole } from "@/lib/guard";
import { ROLES } from "@/lib/roles";
import { getOfficeMonthSummary } from "@/lib/delivery-summary";
import {
  currentISTMonth,
  isValidMonthKey,
  formatMonth,
  formatDateKey,
  weekdayOf,
  shiftMonth,
} from "@/lib/date";
import { formatINR } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-text-muted">{label}</p>
        <p className="mt-1 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function OfficeHome({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await requireRole(ROLES.OFFICE);
  const officeId = session.user.officeId;
  if (!officeId) notFound();

  const sp = await searchParams;
  const monthKey = sp.month && isValidMonthKey(sp.month) ? sp.month : currentISTMonth();

  const summary = await getOfficeMonthSummary(officeId, monthKey);
  const prev = shiftMonth(monthKey, -1);
  const next = shiftMonth(monthKey, 1);
  const isCurrent = monthKey >= currentISTMonth();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Your deliveries</h1>
          <p className="mt-1 text-text-muted">Day-wise and monthly tracking.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/office?month=${prev}`}
            className="rounded-md border border-border p-2 hover:bg-background"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-32 text-center text-sm font-medium">
            {formatMonth(monthKey)}
          </span>
          <Link
            href={isCurrent ? "/office" : `/office?month=${next}`}
            aria-disabled={isCurrent}
            className={
              "rounded-md border border-border p-2 hover:bg-background " +
              (isCurrent ? "pointer-events-none opacity-40" : "")
            }
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric label="Delivery days" value={summary.totals.deliveryDays} />
        <Metric label="Total cups" value={summary.totals.cups} />
        <Metric label="Total amount" value={formatINR(summary.totals.amount)} />
      </div>

      {summary.productTotals.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">This month by product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {summary.productTotals.map((p) => (
                <div key={p.productId} className="rounded-md bg-background px-4 py-2">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-sm text-text-muted">
                    {p.quantity} {p.unit}
                    {p.quantity === 1 ? "" : "s"} · {formatINR(p.amount)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Day-wise activity</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {summary.days.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <div className="rounded-full bg-background p-3">
                <CalendarDays className="h-6 w-6 text-text-muted" />
              </div>
              <p className="font-medium">No deliveries this month</p>
              <p className="text-sm text-text-muted">
                Deliveries logged for your office will appear here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Cups</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.days.map((day) => (
                  <TableRow key={day.dateKey}>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-medium">{formatDateKey(day.dateKey)}</div>
                      <div className="text-xs text-text-muted">{weekdayOf(day.dateKey)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-sm">
                        {day.lines.map((l) => (
                          <span key={l.productId} className="text-text-muted">
                            {l.name} × {l.quantity}{" "}
                            <span className="text-xs">({formatINR(l.unitPrice)})</span>
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{day.dayCups}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatINR(day.dayTotal)}
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
