"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { logDelivery } from "./actions";

type ProductOption = { id: string; name: string; unit: string };

export function LogForm({
  officeId,
  products,
  initialQty,
  alreadyLogged,
}: {
  officeId: string;
  products: ProductOption[];
  initialQty: Record<string, number>;
  alreadyLogged: boolean;
}) {
  const router = useRouter();
  const [qty, setQty] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const p of products) init[p.id] = initialQty[p.id] ?? 0;
    return init;
  });
  const [loading, setLoading] = useState(false);

  function setVal(id: string, val: number) {
    setQty((prev) => ({ ...prev, [id]: Math.max(0, val) }));
  }

  const totalCups = Object.values(qty).reduce((a, b) => a + b, 0);

  async function onSubmit() {
    setLoading(true);
    const items = products.map((p) => ({ productId: p.id, quantity: qty[p.id] ?? 0 }));
    const res = await logDelivery(officeId, items);
    setLoading(false);
    if (res.ok) {
      toast.success(res.message ?? "Delivery logged.");
      router.push("/employee");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="mt-5">
      {alreadyLogged && (
        <p className="mb-3 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary-dark">
          Already logged today — submitting will update it.
        </p>
      )}

      <div className="space-y-3">
        {products.map((p) => (
          <Card key={p.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-text-muted">per {p.unit}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Decrease ${p.name}`}
                onClick={() => setVal(p.id, (qty[p.id] ?? 0) - 1)}
              >
                <Minus />
              </Button>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                aria-label={`${p.name} quantity`}
                className="h-11 w-14 rounded-md border border-border bg-surface text-center text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                value={qty[p.id] ?? 0}
                onChange={(e) => {
                  const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
                  setVal(p.id, Number.isNaN(n) ? 0 : n);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Increase ${p.name}`}
                onClick={() => setVal(p.id, (qty[p.id] ?? 0) + 1)}
              >
                <Plus />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="sticky bottom-4 mt-5">
        <Button
          className="h-14 w-full text-base shadow-card"
          size="lg"
          onClick={onSubmit}
          disabled={loading || totalCups === 0}
        >
          {loading && <Spinner className="h-5 w-5 text-primary-foreground" />}
          {loading
            ? "Saving…"
            : `Submit delivery${totalCups > 0 ? ` · ${totalCups} item${totalCups === 1 ? "" : "s"}` : ""}`}
        </Button>
      </div>
    </div>
  );
}
