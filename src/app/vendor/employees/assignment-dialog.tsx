"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { setEmployeeAssignments } from "./assignment-actions";

export type OfficeOption = { id: string; name: string };

export function AssignmentDialog({
  employeeId,
  employeeName,
  offices,
  assignedIds,
  disabled,
}: {
  employeeId: string;
  employeeName: string;
  offices: OfficeOption[];
  assignedIds: string[];
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(assignedIds));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function onSave() {
    setLoading(true);
    const res = await setEmployeeAssignments(employeeId, [...selected]);
    setLoading(false);
    if (res.ok) {
      toast.success(res.message ?? "Saved.");
      setOpen(false);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setSelected(new Set(assignedIds)); // reset to saved state on open
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          Offices ({assignedIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign offices — {employeeName}</DialogTitle>
          <DialogDescription>
            Choose which offices this employee delivers to. They&apos;ll only see
            and log deliveries for these.
          </DialogDescription>
        </DialogHeader>

        {offices.length === 0 ? (
          <p className="py-4 text-sm text-text-muted">
            No active offices yet. Add an office first.
          </p>
        ) : (
          <div className="space-y-1">
            {offices.map((o) => {
              const checked = selected.has(o.id);
              return (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-background"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={checked}
                    onChange={() => toggle(o.id)}
                  />
                  <span className="text-sm">{o.name}</span>
                </label>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={loading || offices.length === 0}>
            {loading ? "Saving…" : "Save assignments"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
