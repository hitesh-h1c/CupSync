import { Plus, Coffee } from "lucide-react";
import { requireVendor } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Product } from "@/models/Product";
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
import { ProductDialog } from "./product-dialog";
import { ProductRowActions } from "./product-row-actions";

export default async function ProductsPage() {
  const { vendorId } = await requireVendor();

  await dbConnect();
  const [docs, state] = await Promise.all([
    Product.find({ vendor: vendorId }).sort({ createdAt: -1 }).lean(),
    getVendorSubscriptionState(vendorId),
  ]);
  const readOnly = state?.readOnly ?? false;

  const products = docs.map((p) => ({
    id: String(p._id),
    name: p.name,
    unit: p.unit,
    active: p.active,
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="mt-1 text-text-muted">
            The items you deliver. Set per-office prices from the Offices tab.
          </p>
        </div>
        {!readOnly && (
          <ProductDialog
            mode="create"
            trigger={
              <Button>
                <Plus /> Add product
              </Button>
            }
          />
        )}
      </div>

      <Card className="mt-6">
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="rounded-full bg-background p-3">
              <Coffee className="h-6 w-6 text-text-muted" />
            </div>
            <p className="font-medium">No products yet</p>
            <p className="max-w-xs text-sm text-text-muted">
              Add the items you deliver, like cutting chai, full tea, or coffee.
            </p>
            {!readOnly && (
              <ProductDialog
                mode="create"
                trigger={
                  <Button variant="outline">
                    <Plus /> Add your first product
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-text-muted">{p.unit}</TableCell>
                  <TableCell>
                    <Badge variant={p.active ? "success" : "muted"}>
                      {p.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ProductRowActions
                      product={{ id: p.id, name: p.name, unit: p.unit }}
                      active={p.active}
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
