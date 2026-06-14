import { requireRole } from "@/lib/guard";
import { ROLES } from "@/lib/roles";
import { SignOutButton } from "@/components/sign-out-button";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(ROLES.SUPER_ADMIN);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="container flex items-center justify-between py-4">
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-primary">Cup Sync</span>
            <span className="text-xs text-text-muted">Platform admin</span>
          </div>
          <SignOutButton />
        </div>
        <div className="container">
          <AdminNav />
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
