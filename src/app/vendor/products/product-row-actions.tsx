"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductDialog, type ProductData } from "./product-dialog";
import { setProductActive } from "./actions";

export function ProductRowActions({
  product,
  active,
  disabled,
}: {
  product: ProductData;
  active: boolean;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      const res = await setProductActive(product.id, !active);
      res.ok ? toast.success(res.message ?? "Updated.") : toast.error(res.error);
    });
  }

  return (
    <div className="flex justify-end gap-1">
      <ProductDialog
        mode="edit"
        product={product}
        trigger={
          <Button variant="ghost" size="icon" disabled={disabled} aria-label="Edit">
            <Pencil />
          </Button>
        }
      />
      <Button variant="outline" size="sm" onClick={toggleActive} disabled={disabled || pending}>
        {active ? "Deactivate" : "Activate"}
      </Button>
    </div>
  );
}
