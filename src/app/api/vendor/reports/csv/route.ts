import { assertRole, AuthError } from "@/lib/guard";
import { ROLES } from "@/lib/roles";
import { getDeliveryReport } from "@/lib/reports";
import { isValidDateKey } from "@/lib/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Escape a value for CSV (quote if it contains comma/quote/newline). */
function csv(value: string | number): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  try {
    const session = await assertRole(ROLES.VENDOR);
    const vendorId = session.user.vendorId;
    if (!vendorId) return new Response("Forbidden", { status: 403 });

    const params = new URL(req.url).searchParams;
    const from = params.get("from");
    const to = params.get("to");

    const report = await getDeliveryReport({
      vendor: vendorId,
      office: params.get("office") || undefined,
      employee: params.get("employee") || undefined,
      from: from && isValidDateKey(from) ? from : undefined,
      to: to && isValidDateKey(to) ? to : undefined,
    });

    const header = ["Date", "Office", "Employee", "Product", "Quantity", "Unit price", "Line total"];
    const lines = [header.join(",")];
    for (const row of report.rows) {
      for (const it of row.items) {
        lines.push(
          [
            csv(row.dateKey),
            csv(row.officeName),
            csv(row.employeeName),
            csv(it.name),
            csv(it.quantity),
            csv(it.unitPrice.toFixed(2)),
            csv(it.lineTotal.toFixed(2)),
          ].join(",")
        );
      }
    }
    lines.push(""); // blank line before totals
    lines.push(["", "", "", "", "", "Total", report.totals.amount.toFixed(2)].map(csv).join(","));

    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cupsync-report.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return new Response(err.message, { status: err.status });
    console.error("CSV report error:", err);
    return new Response("Failed to generate report", { status: 500 });
  }
}
