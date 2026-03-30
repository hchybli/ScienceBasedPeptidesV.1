"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminCustomersPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/customers");
      if (res.ok) setRows((await res.json()).customers ?? []);
    })();
  }, []);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Customers</h1>
      <ul className="mt-8 space-y-2">
        {rows.map((c) => (
          <li key={String(c.id)}>
            <Link href={`/admin/customers/${c.id}`} className="flex justify-between rounded border border-[var(--border)] px-4 py-3 hover:border-accent/40">
              <span>{String(c.email)}</span>
              <span className="text-sm text-[var(--text-muted)]">{String(c.order_count)} orders</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
