"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createEmployee, updateEmployee } from "./actions";

export type EmployeeData = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export function EmployeeDialog({
  mode,
  employee,
  trigger,
}: {
  mode: "create" | "edit";
  employee?: EmployeeData;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (mode === "edit" && employee) formData.set("id", employee.id);

    const res =
      mode === "create"
        ? await createEmployee(formData)
        : await updateEmployee(formData);

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
          <DialogTitle>
            {mode === "create" ? "Add employee" : "Edit employee"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a login for a delivery employee."
              : "Update this employee's details. Leave password blank to keep it."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emp-name">Name</Label>
            <Input
              id="emp-name"
              name="name"
              required
              defaultValue={employee?.name}
              placeholder="Suresh Kumar"
            />
          </div>

          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="emp-email">Email (login)</Label>
              <Input
                id="emp-email"
                name="email"
                type="email"
                required
                placeholder="suresh@example.com"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="emp-phone">Phone (optional)</Label>
            <Input
              id="emp-phone"
              name="phone"
              defaultValue={employee?.phone}
              placeholder="98765 43210"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-password">
              {mode === "create" ? "Password" : "New password (optional)"}
            </Label>
            <Input
              id="emp-password"
              name="password"
              type="password"
              required={mode === "create"}
              minLength={8}
              placeholder="At least 8 characters"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : mode === "create" ? "Add employee" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
