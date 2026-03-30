"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export default function AccountDashboard() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<Array<{ id: string; total: number; status: string; created_at: number }>>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/account/orders-preview");
      if (res.ok) {
        const d = await res.json();
        setOrders(d.orders ?? []);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Account</h1>
      <p className="mt-2 text-[var(--text-muted)]">
        {user?.email} · {user?.loyaltyPoints ?? 0} loyalty points
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--text-muted)]">Loyalty</p>
            <p className="mt-2 font-mono text-2xl">{user?.loyaltyPoints ?? 0}</p>
            <Button className="mt-4" variant="secondary" asChild>
              <Link href="/account/loyalty">Manage</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--text-muted)]">Subscriptions</p>
            <Button className="mt-4" variant="secondary" asChild>
              <Link href="/account/subscriptions">View</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--text-muted)]">Referrals</p>
            <Button className="mt-4" variant="secondary" asChild>
              <Link href="/account/referrals">Share link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <h2 className="font-display mt-12 text-xl font-semibold">Recent orders</h2>
      <div className="mt-4 space-y-2">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/account/orders/${o.id}`}
            className="flex justify-between rounded-[var(--radius)] border border-[var(--border)] bg-surface px-4 py-3 text-sm hover:border-accent/40"
          >
            <span className="font-mono">{o.id.slice(0, 8)}</span>
            <span>{o.status}</span>
          </Link>
        ))}
        {orders.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No orders yet.</p> : null}
      </div>
    </div>
  );
}
