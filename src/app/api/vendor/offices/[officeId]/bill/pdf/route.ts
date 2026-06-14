import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { assertRole, AuthError } from "@/lib/guard";
import { ROLES } from "@/lib/roles";
import { getOfficeBill } from "@/lib/bill";
import { BillDocument } from "@/lib/pdf/bill-document";
import { currentISTMonth, isValidMonthKey } from "@/lib/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ officeId: string }> }
) {
  try {
    const session = await assertRole(ROLES.VENDOR);
    const vendorId = session.user.vendorId;
    if (!vendorId) return new Response("Forbidden", { status: 403 });

    const { officeId } = await params;
    const monthParam = new URL(req.url).searchParams.get("month");
    const monthKey =
      monthParam && isValidMonthKey(monthParam) ? monthParam : currentISTMonth();

    const bill = await getOfficeBill(vendorId, officeId, monthKey);
    if (!bill) return new Response("Office not found", { status: 404 });

    // BillDocument returns a @react-pdf <Document>; cast bridges its component
    // element type to the renderer's expected ReactElement<DocumentProps>.
    const element = createElement(BillDocument, { bill }) as unknown as ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(element);
    const safeName = bill.office.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bill-${safeName}-${monthKey}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return new Response(err.message, { status: err.status });
    }
    console.error("Bill PDF error:", err);
    return new Response("Failed to generate bill", { status: 500 });
  }
}
