"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboard() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) setData(await res.json());
    })();
  }, []);

  const rev = data?.revenue as Record<string, number> | undefined;
  const byStatus = data?.ordersByStatus as Array<{ status: string; c: number }> | undefined;
  const chart = data?.revenueLast30Days as Array<{ day: number; revenue: number }> | undefined;

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--text-muted)]">Today</p>
            <p className="font-mono text-2xl">{formatCurrency(rev?.today ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--text-muted)]">This month</p>
            <p className="font-mono text-2xl">{formatCurrency(rev?.month ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--text-muted)]">AOV (30d)</p>
            <p className="font-mono text-2xl">{formatCurrency((data?.aov as { last30Days?: number })?.last30Days ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--text-muted)]">MRR (est.)</p>
            <p className="font-mono text-2xl">{formatCurrency((data?.subscriptionMRR as number) ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold">Revenue (30 days)</h2>
        <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-4">
          <div className="flex h-40 items-end gap-1">
          {chart?.map((d, i) => {
            const max = Math.max(...(chart?.map((x) => x.revenue) ?? [1]), 1);
            const h = (d.revenue / max) * 100;
            return (
              <div
                key={i}
                className="flex-1 rounded-t bg-accent/50 hover:bg-accent/70 transition-colors"
                style={{ height: `${Math.max(h, 4)}%` }}
                title={String(d.revenue)}
              />
            );
          })}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="font-display text-xl font-semibold">Orders by status</h2>
          <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-4">
            <ul className="space-y-2 text-sm">
              {byStatus?.map((s) => (
                <li key={s.status} className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">{s.status}</span>
                  <span className="font-mono">{s.c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">Quick links</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button asChild variant="secondary">
              <Link href="/admin/orders">Orders</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/admin/products">Products</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/admin/customers">Customers</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/admin/analytics">Analytics</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/admin/discounts">Discounts</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
