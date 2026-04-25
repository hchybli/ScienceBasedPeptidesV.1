"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type CustomerRow = {
  id: string;
  email: string;
  name: string | null;
  created_at: number;
  order_count: number;
  total_spend: number;
  tags: string[];
  status: "active" | "suspended" | string;
};

export default function AdminCustomersPage() {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [q, setQ] = useState("");
  const [tags, setTags] = useState("");
  const [minSpend, setMinSpend] = useState("");
  const [maxSpend, setMaxSpend] = useState("");
  const [minOrders, setMinOrders] = useState("");
  const [maxOrders, setMaxOrders] = useState("");
  const [loading, setLoading] = useState(true);

  const params = useMemo(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (tags.trim()) sp.set("tags", tags.trim());
    if (minSpend.trim()) sp.set("minSpend", minSpend.trim());
    if (maxSpend.trim()) sp.set("maxSpend", maxSpend.trim());
    if (minOrders.trim()) sp.set("minOrders", minOrders.trim());
    if (maxOrders.trim()) sp.set("maxOrders", maxOrders.trim());
    return sp;
  }, [maxOrders, maxSpend, minOrders, minSpend, q, tags]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/admin/customers?${params.toString()}`, { signal: controller.signal });
          if (!res.ok) return;
          const data = (await res.json()) as { customers?: CustomerRow[] };
          setRows(data.customers ?? []);
        } finally {
          setLoading(false);
        }
      })();
    }, 200);
    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [params]);

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Customers</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Input label="Search" placeholder="Email or ID" value={q} onChange={(e) => setQ(e.target.value)} />
        <Input label="Tags" placeholder="comma separated (e.g. vip, influencer)" value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input label="Min spend" inputMode="decimal" placeholder="0" value={minSpend} onChange={(e) => setMinSpend(e.target.value)} />
        <Input label="Max spend" inputMode="decimal" placeholder="500" value={maxSpend} onChange={(e) => setMaxSpend(e.target.value)} />
        <Input label="Min orders" inputMode="numeric" placeholder="0" value={minOrders} onChange={(e) => setMinOrders(e.target.value)} />
        <Input label="Max orders" inputMode="numeric" placeholder="50" value={maxOrders} onChange={(e) => setMaxOrders(e.target.value)} />
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-[var(--border)] bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total spend</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-sm text-[var(--text-muted)]">
                  Loading customers...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-sm text-[var(--text-muted)]">
                  No customers found.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${c.id}`} className="font-medium text-accent hover:text-[var(--accent-hover)]">
                      {c.email}
                    </Link>
                    <div className="mt-1 font-mono text-xs text-[var(--text-muted)]">{c.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        c.status === "suspended"
                          ? "inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-600"
                          : "inline-flex rounded-full border border-accent/30 bg-accent-muted px-2.5 py-1 text-xs font-semibold text-[var(--text)]"
                      }
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.tags?.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {c.tags.slice(0, 4).map((t) => (
                          <span key={t} className="rounded-full border border-[var(--border)] bg-surface-2 px-2 py-0.5 text-xs text-[var(--text-muted)]">
                            {t}
                          </span>
                        ))}
                        {c.tags.length > 4 ? (
                          <span className="text-xs text-[var(--text-muted)]">+{c.tags.length - 4}</span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono">{c.order_count}</td>
                  <td className="px-4 py-3 font-mono">{formatCurrency(c.total_spend)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
