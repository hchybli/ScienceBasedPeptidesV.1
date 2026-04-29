"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/affiliates", label: "Affiliates" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/lab-reports", label: "Lab reports" },
  { href: "/admin/email-sequences", label: "Email sequences" },
];

function getTitle(pathname: string): string {
  if (pathname === "/admin") return "Overview";
  const match = NAV.find((n) => n.href !== "/admin" && pathname.startsWith(n.href));
  return match?.label ?? "Admin";
}

export function AdminHeader() {
  const pathname = usePathname() || "/admin";
  const title = getTitle(pathname);

  return (
    <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-medium tracking-wide text-[var(--text-muted)]">Admin</p>
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
      </div>
      <nav className="flex flex-wrap gap-x-2 gap-y-2 text-sm">
        {NAV.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "rounded-full bg-surface px-3 py-1 text-foreground shadow-sm"
                  : "rounded-full px-3 py-1 text-[var(--text-muted)] hover:bg-surface hover:text-foreground"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

