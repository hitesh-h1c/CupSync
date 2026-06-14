"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { extendTrial, setSubscriptionStatus, setVendorActive } from "./actions";

export type VendorRow = {
  id: string;
  business: string;
  status: "trialing" | "active" | "expired";
  suspended: boolean;
};

export function VendorActions({ vendor }: { vendor: VendorRow }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [days, setDays] = useState(14);

  function run(fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      res.ok ? toast.success(res.message ?? "Done.") : toast.error(res.error ?? "Failed.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 /> Manage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage — {vendor.business}</DialogTitle>
          <DialogDescription>
            Adjust this vendor&apos;s subscription and account access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label className="mb-2 block">Subscription status</Label>
            <div className="flex gap-2">
              {(["trialing", "active", "expired"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={vendor.status === s ? "default" : "outline"}
                  disabled={pending}
                  onClick={() => run(() => setSubscriptionStatus(vendor.id, s))}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="days" className="mb-2 block">
              Extend trial
            </Label>
            <div className="flex gap-2">
              <Input
                id="days"
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-24"
              />
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => run(() => extendTrial(vendor.id, days))}
              >
                Extend by {days} days
              </Button>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Account access</Label>
            <Button
              variant={vendor.suspended ? "default" : "destructive"}
              size="sm"
              disabled={pending}
              onClick={() => run(() => setVendorActive(vendor.id, vendor.suspended))}
            >
              {vendor.suspended ? "Restore access" : "Suspend vendor"}
            </Button>
            <p className="mt-2 text-xs text-text-muted">
              Suspending blocks login for the vendor and all their employees and
              offices. Data is kept.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
