"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

type Customer = {
  id: string;
  email: string;
  name: string | null;
  loyalty_points: number;
  referral_code: string;
  created_at: number;
  last_purchase_at: number | null;
  referredBy: { id: string; email: string } | null;
};

type Order = { id: string; status: string; total: number; created_at: number };
type LoyaltyTx = { id: string; points: number; reason: string; order_id: string | null; created_at: number };
type Referral = { id: string; referred_email: string | null; referred_user_id: string | null; status: string; created_at: number; converted_at: number | null };

export default function AdminCustomerPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<{
    customer: Customer;
    orders: Order[];
    loyaltyTransactions: LoyaltyTx[];
    referrals: Referral[];
  } | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/admin/customers/${id}`);
      if (res.ok) setData(await res.json());
    })();
  }, [id]);

  if (!data) return <div className="text-sm text-[var(--text-muted)]">Loading…</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">{data.customer.email}</h2>
        <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">{data.customer.id}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--text-muted)]">Loyalty points</p>
            <p className="mt-2 font-mono text-2xl">{data.customer.loyalty_points}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--text-muted)]">Referral code</p>
            <p className="mt-2 font-mono text-2xl">{data.customer.referral_code}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--text-muted)]">Joined</p>
            <p className="mt-2 font-mono text-2xl">{formatDate(data.customer.created_at)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-semibold">Orders</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="py-2">Order</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.length ? (
                  data.orders.map((o) => (
                    <tr key={o.id} className="border-b border-[var(--border)]">
                      <td className="py-3">
                        <Link className="font-mono text-xs text-accent underline" href={`/admin/orders/${o.id}`}>
                          {o.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td>{o.status}</td>
                      <td className="font-mono">{formatCurrency(o.total)}</td>
                      <td>{formatDate(o.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 text-sm text-[var(--text-muted)]">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-semibold">Loyalty history</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="py-2">When</th>
                  <th>Points</th>
                  <th>Reason</th>
                  <th>Order</th>
                </tr>
              </thead>
              <tbody>
                {data.loyaltyTransactions.length ? (
                  data.loyaltyTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-[var(--border)]">
                      <td className="py-3">{formatDate(t.created_at)}</td>
                      <td className="font-mono">{t.points}</td>
                      <td>{t.reason}</td>
                      <td className="font-mono text-xs">{t.order_id ? t.order_id.slice(0, 8) : "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 text-sm text-[var(--text-muted)]">
                      No loyalty transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-semibold">Referrals</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Referred by: {data.customer.referredBy ? data.customer.referredBy.email : "—"}
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="py-2">When</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Converted</th>
                </tr>
              </thead>
              <tbody>
                {data.referrals.length ? (
                  data.referrals.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--border)]">
                      <td className="py-3">{formatDate(r.created_at)}</td>
                      <td>{r.referred_email ?? "—"}</td>
                      <td>{r.status}</td>
                      <td>{r.converted_at ? formatDate(r.converted_at) : "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 text-sm text-[var(--text-muted)]">
                      No referral activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
