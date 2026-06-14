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
import { setOfficeRate } from "./actions";

export function SetRateDialog({
  officeId,
  productId,
  productName,
  currentPrice,
  todayKey,
  trigger,
}: {
  officeId: string;
  productId: string;
  productName: string;
  currentPrice: number | null;
  todayKey: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("officeId", officeId);
    formData.set("productId", productId);

    const res = await setOfficeRate(formData);
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
          <DialogTitle>Set price — {productName}</DialogTitle>
          <DialogDescription>
            The new price applies from the date you choose. Past prices and bills
            are never changed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rate-price">Price (₹)</Label>
            <Input
              id="rate-price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={currentPrice ?? ""}
              placeholder="10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate-date">Effective from</Label>
            <Input
              id="rate-date"
              name="effectiveFrom"
              type="date"
              required
              defaultValue={todayKey}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner className="h-4 w-4 text-primary-foreground" />}
              {loading ? "Saving…" : "Save price"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
