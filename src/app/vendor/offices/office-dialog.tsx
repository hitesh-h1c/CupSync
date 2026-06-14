"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createOffice, updateOffice } from "./actions";

export type OfficeData = {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  dailyEmailEnabled: boolean;
};

export function OfficeDialog({
  mode,
  office,
  trigger,
}: {
  mode: "create" | "edit";
  office?: OfficeData;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dailyEmail, setDailyEmail] = useState(office?.dailyEmailEnabled ?? true);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("dailyEmailEnabled", String(dailyEmail));
    if (mode === "edit" && office) formData.set("id", office.id);

    const res =
      mode === "create" ? await createOffice(formData) : await updateOffice(formData);

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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add office" : "Edit office"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Adding an office creates its own login so they can track deliveries."
              : "Update this office's details. Leave password blank to keep it."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="off-name">Office name</Label>
            <Input
              id="off-name"
              name="name"
              required
              defaultValue={office?.name}
              placeholder="Acme Corp — 3rd floor"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="off-address">Address (optional)</Label>
            <Input
              id="off-address"
              name="address"
              defaultValue={office?.address}
              placeholder="221B, MG Road"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="off-contact">Contact person (optional)</Label>
              <Input
                id="off-contact"
                name="contactPerson"
                defaultValue={office?.contactPerson}
                placeholder="Priya Shah"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="off-cemail">Summary email (optional)</Label>
              <Input
                id="off-cemail"
                name="contactEmail"
                type="email"
                defaultValue={office?.contactEmail}
                placeholder="admin@acme.com"
              />
            </div>
          </div>

          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="off-login">Login email</Label>
              <Input
                id="off-login"
                name="loginEmail"
                type="email"
                required
                placeholder="acme@example.com"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="off-password">
              {mode === "create" ? "Login password" : "New password (optional)"}
            </Label>
            <Input
              id="off-password"
              name="password"
              type="password"
              required={mode === "create"}
              minLength={8}
              placeholder="At least 8 characters"
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Daily summary email</p>
              <p className="text-xs text-text-muted">Send a 10 PM summary to this office.</p>
            </div>
            <Switch checked={dailyEmail} onCheckedChange={setDailyEmail} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : mode === "create" ? "Add office" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
