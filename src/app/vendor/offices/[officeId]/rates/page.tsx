import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { requireVendor } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Office } from "@/models/Office";
import { Product } from "@/models/Product";
import { OfficeRate } from "@/models/OfficeRate";
import { getVendorSubscriptionState } from "@/lib/subscription";
import { istDateKey, formatDateKey, dateKeyToUTCDate } from "@/lib/date";
import { formatINR } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SetRateDialog } from "./set-rate-dialog";

export default async function OfficeRatesPage({
  params,
}: {
  params: Promise<{ officeId: string }>;
}) {
  const { officeId } = await params;
  const { vendorId } = await requireVendor();

  await dbConnect();
  const office = await Office.findOne({ _id: officeId, vendor: vendorId })
    .select("name")
    .lean();
  if (!office) notFound();

  const [products, rates, state] = await Promise.all([
    Product.find({ vendor: vendorId, active: true }).sort({ name: 1 }).lean(),
    OfficeRate.find({ office: officeId }).sort({ effectiveFrom: -1 }).lean(),
    getVendorSubscriptionState(vendorId),
  ]);
  const readOnly = state?.readOnly ?? false;
  const todayKey = istDateKey();
  const todayCutoff = dateKeyToUTCDate(todayKey).getTime();

  // Group rate history by product, newest first.
  const historyByProduct = new Map<
    string,
    { price: number; effectiveFrom: string }[]
  >();
  for (const r of rates) {
    const key = String(r.product);
    const list = historyByProduct.get(key) ?? [];
    list.push({ price: r.price, effectiveFrom: istDateKeyFromUTC(r.effectiveFrom) });
    historyByProduct.set(key, list);
  }

  // Current effective price = newest history row with effectiveFrom <= today.
  function currentPrice(productId: string): number | null {
    const list = historyByProduct.get(productId) ?? [];
    const active = list.find(
      (h) => dateKeyToUTCDate(h.effectiveFrom).getTime() <= todayCutoff
    );
    return active ? active.price : null;
  }

  return (
    <div>
      <Link
        href="/vendor/offices"
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" /> Back to offices
      </Link>
      <h1 className="text-2xl font-bold">Rates — {office.name}</h1>
      <p className="mt-1 text-text-muted">
        Set a price per product for this office. Prices are effective-dated, so
        changes never affect past bills.
      </p>

      {products.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="px-6 py-12 text-center text-sm text-text-muted">
            Add products first, then set their prices here.{" "}
            <Link href="/vendor/products" className="font-medium text-primary hover:underline">
              Go to Products
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {products.map((p) => {
            const pid = String(p._id);
            const price = currentPrice(pid);
            const history = historyByProduct.get(pid) ?? [];
            return (
              <Card key={pid}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <p className="mt-1 text-sm text-text-muted">
                      Current:{" "}
                      <span className="font-semibold text-text">
                        {price === null ? "Not set" : `${formatINR(price)} / ${p.unit}`}
                      </span>
                    </p>
                  </div>
                  {!readOnly && (
                    <SetRateDialog
                      officeId={officeId}
                      productId={pid}
                      productName={p.name}
                      currentPrice={price}
                      todayKey={todayKey}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Plus /> {price === null ? "Set price" : "Update"}
                        </Button>
                      }
                    />
                  )}
                </CardHeader>
                {history.length > 0 && (
                  <CardContent>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
                      Price history
                    </p>
                    <ul className="space-y-1 text-sm">
                      {history.map((h, i) => (
                        <li key={i} className="flex justify-between">
                          <span className="text-text-muted">
                            from {formatDateKey(h.effectiveFrom)}
                          </span>
                          <span className="font-medium">{formatINR(h.price)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** effectiveFrom is stored UTC-midnight; its date key is the UTC calendar day. */
function istDateKeyFromUTC(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}
