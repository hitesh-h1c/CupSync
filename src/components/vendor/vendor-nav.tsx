"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/vendor", label: "Dashboard", exact: true },
  { href: "/vendor/employees", label: "Employees" },
  { href: "/vendor/offices", label: "Offices" },
  { href: "/vendor/products", label: "Products" },
  { href: "/vendor/reports", label: "Reports" },
  { href: "/vendor/billing", label: "Subscription" },
];

export function VendorNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              active
                ? "border-primary text-primary-dark"
                : "border-transparent text-text-muted hover:text-text"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
