"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmployeeDialog, type EmployeeData } from "./employee-dialog";
import { setEmployeeActive, deleteEmployee } from "./actions";

export function EmployeeRowActions({
  employee,
  active,
  disabled,
}: {
  employee: EmployeeData;
  active: boolean;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function toggleActive() {
    startTransition(async () => {
      const res = await setEmployeeActive(employee.id, !active);
      res.ok ? toast.success(res.message ?? "Updated.") : toast.error(res.error);
    });
  }

  function onDelete() {
    startTransition(async () => {
      const res = await deleteEmployee(employee.id);
      if (res.ok) {
        toast.success(res.message ?? "Removed.");
        setConfirmOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex justify-end gap-1">
      <EmployeeDialog
        mode="edit"
        employee={employee}
        trigger={
          <Button variant="ghost" size="icon" disabled={disabled} aria-label="Edit">
            <Pencil />
          </Button>
        }
      />

      <Button
        variant="outline"
        size="sm"
        onClick={toggleActive}
        disabled={disabled || pending}
      >
        {active ? "Deactivate" : "Activate"}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label="Delete"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="text-error" />
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove employee?</DialogTitle>
            <DialogDescription>
              This deletes {employee.name}&apos;s login. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={pending}>
              {pending ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
