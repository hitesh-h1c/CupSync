import { Plus, Building2 } from "lucide-react";
import { requireVendor } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Office } from "@/models/Office";
import "@/models/User"; // ensure User schema is registered for populate
import { getVendorSubscriptionState } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OfficeDialog } from "./office-dialog";
import { OfficeRowActions } from "./office-row-actions";

type PopulatedUser = { email: string };

export default async function OfficesPage() {
  const { vendorId } = await requireVendor();

  await dbConnect();
  const [docs, state] = await Promise.all([
    Office.find({ vendor: vendorId })
      .populate<{ user: PopulatedUser }>("user", "email")
      .sort({ createdAt: -1 })
      .lean(),
    getVendorSubscriptionState(vendorId),
  ]);

  const readOnly = state?.readOnly ?? false;

  const offices = docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    address: d.address ?? "",
    contactPerson: d.contactPerson ?? "",
    contactEmail: d.contactEmail ?? "",
    dailyEmailEnabled: d.dailyEmailEnabled,
    loginEmail: d.user?.email ?? "—",
    active: d.active,
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Offices</h1>
          <p className="mt-1 text-text-muted">
            Client offices you deliver to. Each gets its own login.
          </p>
        </div>
        {!readOnly && (
          <OfficeDialog
            mode="create"
            trigger={
              <Button>
                <Plus /> Add office
              </Button>
            }
          />
        )}
      </div>

      <Card className="mt-6">
        {offices.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="rounded-full bg-background p-3">
              <Building2 className="h-6 w-6 text-text-muted" />
            </div>
            <p className="font-medium">No offices yet</p>
            <p className="max-w-xs text-sm text-text-muted">
              Add the offices you deliver to. Each office gets its own login to
              track deliveries.
            </p>
            {!readOnly && (
              <OfficeDialog
                mode="create"
                trigger={
                  <Button variant="outline">
                    <Plus /> Add your first office
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Office</TableHead>
                <TableHead>Login email</TableHead>
                <TableHead>Daily email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offices.map((off) => (
                <TableRow key={off.id}>
                  <TableCell>
                    <div className="font-medium">{off.name}</div>
                    {off.address && (
                      <div className="text-xs text-text-muted">{off.address}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-text-muted">{off.loginEmail}</TableCell>
                  <TableCell>
                    <Badge variant={off.dailyEmailEnabled ? "default" : "muted"}>
                      {off.dailyEmailEnabled ? "On" : "Off"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={off.active ? "success" : "muted"}>
                      {off.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <OfficeRowActions
                      office={{
                        id: off.id,
                        name: off.name,
                        address: off.address,
                        contactPerson: off.contactPerson,
                        contactEmail: off.contactEmail,
                        dailyEmailEnabled: off.dailyEmailEnabled,
                      }}
                      active={off.active}
                      disabled={readOnly}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
