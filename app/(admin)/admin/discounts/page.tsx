"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type DiscountCode = {
  id: string;
  code: string;
  type: string;
  value: number;
  min_order_value: number | null;
  max_uses: number | null;
  used_count: number;
  is_active: number;
  expires_at: number | null;
  applicable_product_ids: string;
  created_at: number;
};

export default function AdminDiscountsPage() {
  const [rows, setRows] = useState<DiscountCode[]>([]);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState({
    code: "",
    type: "percentage",
    value: 10,
    min_order_value: "",
    max_uses: "",
    expires_at: "",
  });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/discount-codes");
    if (!res.ok) {
      setError(`Failed to load (${res.status})`);
      return;
    }
    const data = (await res.json()) as { discountCodes: DiscountCode[] };
    setRows(data.discountCodes ?? []);
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
    return rows.filter((r) => r.code.toLowerCase().includes(needle) || r.type.toLowerCase().includes(needle));
  }, [q, rows]);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold">Discount codes</h2>
        <Button type="button" onClick={() => setCreating((v) => !v)}>
          {creating ? "Close" : "New code"}
        </Button>
      </div>

      {error ? <div className="rounded-[var(--radius)] border border-red-500/30 bg-red-500/10 p-3 text-sm">Error: {error}</div> : null}

      <div className="flex flex-wrap gap-4">
        <div className="min-w-[240px] flex-1">
          <Input label="Search" placeholder="Code or type" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button type="button" variant="secondary" onClick={load} className="mt-7">
          Refresh
        </Button>
      </div>

      {creating ? (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold">Create</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Input label="Code" value={newCode.code} onChange={(e) => setNewCode({ ...newCode, code: e.target.value })} />
              <Input
                label="Type (percentage/fixed)"
                value={newCode.type}
                onChange={(e) => setNewCode({ ...newCode, type: e.target.value.toLowerCase() })}
              />
              <Input
                label="Value"
                type="number"
                value={newCode.value}
                onChange={(e) => setNewCode({ ...newCode, value: Number(e.target.value) })}
              />
              <Input
                label="Minimum order value"
                type="number"
                value={newCode.min_order_value}
                onChange={(e) => setNewCode({ ...newCode, min_order_value: e.target.value })}
              />
              <Input
                label="Max uses"
                type="number"
                value={newCode.max_uses}
                onChange={(e) => setNewCode({ ...newCode, max_uses: e.target.value })}
              />
              <Input
                label="Expiry (unix seconds)"
                type="number"
                value={newCode.expires_at}
                onChange={(e) => setNewCode({ ...newCode, expires_at: e.target.value })}
              />
            </div>
            <div className="mt-4">
              <Button
                type="button"
                onClick={async () => {
                  setError(null);
                  const payload = {
                    code: newCode.code.trim(),
                    type: newCode.type,
                    value: newCode.value,
                    min_order_value: newCode.min_order_value.trim() ? Number(newCode.min_order_value) : null,
                    max_uses: newCode.max_uses.trim() ? Number(newCode.max_uses) : null,
                    expires_at: newCode.expires_at.trim() ? Number(newCode.expires_at) : null,
                  };
                  const res = await fetch("/api/admin/discount-codes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  if (!res.ok) {
                    setError(`Create failed (${res.status})`);
                    return;
                  }
                  setNewCode({
                    code: "",
                    type: "percentage",
                    value: 10,
                    min_order_value: "",
                    max_uses: "",
                    expires_at: "",
                  });
                  setCreating(false);
                  await load();
                }}
                disabled={!newCode.code.trim() || !newCode.type.trim()}
              >
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
              <th className="py-2">Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Used</th>
              <th>Min order</th>
              <th>Max uses</th>
              <th>Expires</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-[var(--border)]">
                <td className="py-3 font-mono">{r.code}</td>
                <td>{r.type}</td>
                <td className="font-mono">{r.value}</td>
                <td className="font-mono">{r.used_count}</td>
                <td className="font-mono">{r.min_order_value != null ? r.min_order_value : "-"}</td>
                <td className="font-mono">{r.max_uses != null ? `${r.used_count}/${r.max_uses}` : "-"}</td>
                <td className="font-mono">{r.expires_at != null ? new Date(r.expires_at * 1000).toLocaleString() : "-"}</td>
                <td>
                  <Badge variant={r.is_active ? "success" : "neutral"}>{r.is_active ? "active" : "inactive"}</Badge>
                </td>
                <td className="text-right">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={async () => {
                      const res = await fetch(`/api/admin/discount-codes/${r.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ is_active: r.is_active ? 0 : 1 }),
                      });
                      if (!res.ok) setError(`Toggle failed (${res.status})`);
                      else await load();
                    }}
                  >
                    {r.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
