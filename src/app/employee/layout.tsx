import { requireRole } from "@/lib/guard";
import { ROLES } from "@/lib/roles";
import { SignOutButton } from "@/components/sign-out-button";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(ROLES.EMPLOYEE);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="flex flex-col">
            <span className="text-base font-semibold text-primary">Cup Sync</span>
            <span className="text-xs text-text-muted">{session.user.name}</span>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 py-5">{children}</main>
    </div>
  );
}
