import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, CalendarDays } from "lucide-react";
import { requireVendor } from "@/lib/guard";
import { getOfficeBill } from "@/lib/bill";
import {
  currentISTMonth,
  isValidMonthKey,
  formatMonth,
  shiftMonth,
} from "@/lib/date";
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

export default async function OfficeBillPage({
  params,
  searchParams,
}: {
  params: Promise<{ officeId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { officeId } = await params;
  const { vendorId } = await requireVendor();

  const sp = await searchParams;
  const monthKey = sp.month && isValidMonthKey(sp.month) ? sp.month : currentISTMonth();

  const bill = await getOfficeBill(vendorId, officeId, monthKey);
  if (!bill) notFound();

  const prev = shiftMonth(monthKey, -1);
  const next = shiftMonth(monthKey, 1);
  const base = `/vendor/offices/${officeId}/bill`;
  const hasData = bill.totals.deliveryDays > 0;

  return (
    <div>
      <Link
        href="/vendor/offices"
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" /> Back to offices
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bill — {bill.office.name}</h1>
          <p className="mt-1 text-text-muted">{bill.business}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`${base}?month=${prev}`} className="rounded-md border border-border p-2 hover:bg-background" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-32 text-center text-sm font-medium">{formatMonth(monthKey)}</span>
          <Link href={`${base}?month=${next}`} className="rounded-md border border-border p-2 hover:bg-background" aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Link>
          {hasData && (
            <Button asChild>
              <a href={`/api/vendor/offices/${officeId}/bill/pdf?month=${monthKey}`}>
                <Download /> Download PDF
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Delivery days", value: bill.totals.deliveryDays },
          { label: "Total cups", value: bill.totals.cups },
          { label: "Total amount", value: formatINR(bill.totals.amount) },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5">
              <p className="text-sm text-text-muted">{m.label}</p>
              <p className="mt-1 text-3xl font-bold">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!hasData ? (
        <Card className="mt-6">
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <div className="rounded-full bg-background p-3">
              <CalendarDays className="h-6 w-6 text-text-muted" />
            </div>
            <p className="font-medium">No deliveries in {formatMonth(monthKey)}</p>
            <p className="text-sm text-text-muted">Nothing to bill for this month yet.</p>
          </div>
        </Card>
      ) : (
        <>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Summary by product</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bill.productLines.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right">
                        {p.quantity} {p.unit}
                        {p.quantity === 1 ? "" : "s"}
                      </TableCell>
                      <TableCell className="text-right">{formatINR(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-semibold">Total</TableCell>
                    <TableCell />
                    <TableCell className="text-right text-lg font-bold">
                      {formatINR(bill.totals.amount)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Day-wise detail</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bill.days.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">{d.date}</div>
                        <div className="text-xs text-text-muted">{d.weekday}</div>
                      </TableCell>
                      <TableCell className="text-sm text-text-muted">
                        {d.items
                          .map((it) => `${it.name} ×${it.quantity} (${formatINR(it.unitPrice)})`)
                          .join(", ")}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatINR(d.dayTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
