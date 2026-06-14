import Link from "next/link";
import { requireVendor } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Vendor } from "@/models/Vendor";
import { getVendorSubscriptionState } from "@/lib/subscription";
import { SignOutButton } from "@/components/sign-out-button";
import { TrialBanner } from "@/components/trial-banner";
import { VendorNav } from "@/components/vendor/vendor-nav";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { vendorId } = await requireVendor();

  await dbConnect();
  const [vendor, state] = await Promise.all([
    Vendor.findById(vendorId).select("businessName").lean(),
    getVendorSubscriptionState(vendorId),
  ]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="container flex items-center justify-between py-4">
          <Link href="/vendor" className="flex flex-col">
            <span className="text-lg font-semibold text-primary">Cup Sync</span>
            <span className="text-xs text-text-muted">
              {vendor?.businessName ?? "Your business"}
            </span>
          </Link>
          <SignOutButton />
        </div>
        <div className="container">
          <VendorNav />
        </div>
      </header>

      <main className="container py-6">
        <div className="mb-6">
          <TrialBanner state={state} />
        </div>
        {children}
      </main>
    </div>
  );
}
