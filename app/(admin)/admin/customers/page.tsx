"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export default function AdminCustomersPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/customers");
      if (res.ok) setRows((await res.json()).customers ?? []);
    })();
  }, []);

  const filtered = rows.filter((c) => {
    if (!q.trim()) return true;
    const needle = q.trim().toLowerCase();
    return String(c.email ?? "").toLowerCase().includes(needle) || String(c.id ?? "").toLowerCase().includes(needle);
  });

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Customers</h2>
      <div className="mt-6">
        <Input label="Search" placeholder="Email or ID" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <ul className="mt-8 space-y-2">
        {filtered.map((c) => (
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
