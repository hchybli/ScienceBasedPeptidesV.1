"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Array<{ id: string; total: number; status: string; created_at: number; itemCount: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/account/orders", { credentials: "include" });
        if (res.ok) {
          const d = await res.json();
          setOrders(d.orders ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalOrders = orders.length;
  const mostRecent = orders[0]?.created_at ? formatDate(orders[0].created_at) : "—";
  const lifetimeSpend = orders.reduce((sum, order) => sum + Number(order.total), 0);

  const statusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("paid")) return "Paid";
    if (s.includes("processing")) return "Processing";
    if (s.includes("fulfilled")) return "Fulfilled";
    if (s.includes("shipped")) return "Shipped";
    if (s.includes("delivered")) return "Delivered";
    if (s.includes("cancel")) return "Cancelled";
    if (s.includes("pending")) return "Processing";
    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <header className="rounded-2xl border border-[var(--border)] bg-surface p-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Orders</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">View your past purchases and order details.</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Only orders placed while signed in to your account will appear here.
        </p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-surface px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Total Orders</p>
          <p className="mt-1 text-2xl font-semibold">{loading ? "..." : totalOrders}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-surface px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Most Recent Order</p>
          <p className="mt-1 text-2xl font-semibold">{loading ? "..." : mostRecent}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-surface px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Lifetime Spend</p>
          <p className="mt-1 text-2xl font-semibold">{loading ? "..." : formatCurrency(lifetimeSpend)}</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-surface p-6">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Order History</h2>

        {loading ? (
          <p className="mt-5 text-sm text-[var(--text-muted)]">Loading your orders...</p>
        ) : orders.length === 0 ? (
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-surface-2/60 p-6 text-center">
            <p className="font-semibold">No orders yet.</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Orders placed while signed in will appear here.</p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/shop">Shop Products</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl border border-[var(--border)] bg-surface-2/70 px-4 py-4">
                <div className="grid gap-3 md:grid-cols-[1.1fr_1fr_0.9fr_0.8fr_1fr_auto] md:items-center">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Order Number</p>
                    <p className="font-mono text-sm">{o.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Date</p>
                    <p className="text-sm">{formatDate(o.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Status</p>
                    <p className="text-sm">{statusLabel(o.status)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Items</p>
                    <p className="text-sm">{o.itemCount}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Total</p>
                    <p className="font-mono text-sm">{formatCurrency(o.total)}</p>
                  </div>
                  <div>
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/account/orders/${o.id}`}>
                        View Details <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-surface p-6">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/shop">Shop Products</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/account">Back to Account</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
