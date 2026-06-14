import { requireRole } from "@/lib/guard";
import { ROLES } from "@/lib/roles";
import { dbConnect } from "@/lib/db";
import { Office } from "@/models/Office";
import { SignOutButton } from "@/components/sign-out-button";

export default async function OfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(ROLES.OFFICE);

  await dbConnect();
  const office = session.user.officeId
    ? await Office.findById(session.user.officeId).select("name").lean()
    : null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="container flex items-center justify-between py-4">
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-primary">Cup Sync</span>
            <span className="text-xs text-text-muted">
              {office?.name ?? "Your office"}
            </span>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
