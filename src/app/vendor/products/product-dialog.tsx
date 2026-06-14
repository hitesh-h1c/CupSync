"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createProduct, updateProduct } from "./actions";

export type ProductData = { id: string; name: string; unit: string };

export function ProductDialog({
  mode,
  product,
  trigger,
}: {
  mode: "create" | "edit";
  product?: ProductData;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (mode === "edit" && product) formData.set("id", product.id);

    const res =
      mode === "create" ? await createProduct(formData) : await updateProduct(formData);
    setLoading(false);

    if (res.ok) {
      toast.success(res.message ?? "Saved.");
      setOpen(false);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add product" : "Edit product"}</DialogTitle>
          <DialogDescription>
            Products are the items you deliver, like cutting chai or coffee.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prod-name">Name</Label>
            <Input
              id="prod-name"
              name="name"
              required
              defaultValue={product?.name}
              placeholder="Cutting chai"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prod-unit">Unit</Label>
            <Input
              id="prod-unit"
              name="unit"
              defaultValue={product?.unit ?? "cup"}
              placeholder="cup"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner className="h-4 w-4 text-primary-foreground" />}
              {loading ? "Saving…" : mode === "create" ? "Add product" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
