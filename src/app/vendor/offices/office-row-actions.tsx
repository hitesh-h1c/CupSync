"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Trash2, IndianRupee, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OfficeDialog, type OfficeData } from "./office-dialog";
import { setOfficeActive, deleteOffice } from "./actions";

export function OfficeRowActions({
  office,
  active,
  disabled,
}: {
  office: OfficeData;
  active: boolean;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function toggleActive() {
    startTransition(async () => {
      const res = await setOfficeActive(office.id, !active);
      res.ok ? toast.success(res.message ?? "Updated.") : toast.error(res.error);
    });
  }

  function onDelete() {
    startTransition(async () => {
      const res = await deleteOffice(office.id);
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
      <Button asChild variant="outline" size="sm">
        <Link href={`/vendor/offices/${office.id}/rates`}>
          <IndianRupee /> Rates
        </Link>
      </Button>

      <Button asChild variant="outline" size="sm">
        <Link href={`/vendor/offices/${office.id}/bill`}>
          <FileText /> Bill
        </Link>
      </Button>

      <OfficeDialog
        mode="edit"
        office={office}
        trigger={
          <Button variant="ghost" size="icon" disabled={disabled} aria-label="Edit">
            <Pencil />
          </Button>
        }
      />

      <Button variant="outline" size="sm" onClick={toggleActive} disabled={disabled || pending}>
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
            <DialogTitle>Remove office?</DialogTitle>
            <DialogDescription>
              This deletes {office.name} and its login. This can&apos;t be undone.
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
