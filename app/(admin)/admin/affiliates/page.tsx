"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type AffiliateRow = {
  id: string;
  name: string | null;
  email: string;
  referralCode: string;
  referredUsers: number;
  conversions: number;
  conversionRate: number;
  affiliateClicks: number;
  qualifiedReferredOrders: number;
  revenueBroughtIn: number;
  averageOrderValue: number;
};

export default function AdminAffiliatesPage() {
  const [rows, setRows] = useState<AffiliateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/affiliates/performance");
    if (!res.ok) {
      setError(`Failed to load (${res.status})`);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { affiliates?: AffiliateRow[] };
    setRows(data.affiliates ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => {
      return (
        row.email.toLowerCase().includes(needle) ||
        (row.name ?? "").toLowerCase().includes(needle) ||
        row.referralCode.toLowerCase().includes(needle)
      );
    });
  }, [q, rows]);

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">Affiliates</h2>
          <p className="text-sm text-[var(--text-muted)]">Revenue attributed through referred customer orders.</p>
        </div>
        <Button type="button" variant="secondary" onClick={load}>
          Refresh
        </Button>
      </div>

      {error ? <div className="rounded-[var(--radius)] border border-red-500/30 bg-red-500/10 p-3 text-sm">Error: {error}</div> : null}

      <div className="max-w-md">
        <Input label="Search" placeholder="Name, email, or referral code" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
              <th className="px-4 py-3">Affiliate</th>
              <th className="px-4 py-3">Referral code</th>
              <th className="px-4 py-3">Clicks</th>
              <th className="px-4 py-3">Referred users</th>
              <th className="px-4 py-3">Conversions</th>
              <th className="px-4 py-3">Qualified orders</th>
              <th className="px-4 py-3">Revenue brought in</th>
              <th className="px-4 py-3">AOV</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-4 text-[var(--text-muted)]" colSpan={8}>
                  Loading affiliates...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-[var(--text-muted)]" colSpan={8}>
                  No affiliates found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.name || "Unnamed user"}</div>
                    <div className="text-xs text-[var(--text-muted)]">{row.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono">{row.referralCode}</td>
                  <td className="px-4 py-3 font-mono">{row.affiliateClicks}</td>
                  <td className="px-4 py-3 font-mono">{row.referredUsers}</td>
                  <td className="px-4 py-3 font-mono">
                    {row.conversions} <span className="text-xs text-[var(--text-muted)]">({Math.round(row.conversionRate * 100)}%)</span>
                  </td>
                  <td className="px-4 py-3 font-mono">{row.qualifiedReferredOrders}</td>
                  <td className="px-4 py-3 font-mono">{formatCurrency(row.revenueBroughtIn)}</td>
                  <td className="px-4 py-3 font-mono">{formatCurrency(row.averageOrderValue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

