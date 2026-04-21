"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [newCode, setNewCode] = useState({ code: "", type: "percentage", value: 10 });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const res = await fetch("/api/admin/discount-codes");
    if (!res.ok) {
      setError(`Failed to load (${res.status})`);
      return;
    }
    const data = (await res.json()) as { discountCodes: DiscountCode[] };
    setRows(data.discountCodes ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

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
              <Input label="Type" value={newCode.type} onChange={(e) => setNewCode({ ...newCode, type: e.target.value })} />
              <Input
                label="Value"
                type="number"
                value={newCode.value}
                onChange={(e) => setNewCode({ ...newCode, value: Number(e.target.value) })}
              />
            </div>
            <div className="mt-4">
              <Button
                type="button"
                onClick={async () => {
                  setError(null);
                  const res = await fetch("/api/admin/discount-codes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newCode),
                  });
                  if (!res.ok) {
                    setError(`Create failed (${res.status})`);
                    return;
                  }
                  setNewCode({ code: "", type: "percentage", value: 10 });
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
