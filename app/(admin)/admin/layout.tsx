import type { ReactNode } from "react";
import { AdminHeader } from "@/components/layout/admin-header";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <AdminHeader />
      <main className="mt-8">{children}</main>
    </div>
  );
}

