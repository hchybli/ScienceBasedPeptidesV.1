"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  is_active: number;
  category_name?: string;
  variant_count?: number;
  low_stock_count?: number;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [q, setQ] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/products");
      if (res.ok) setProducts(((await res.json()).products ?? []) as ProductRow[]);
    })();
  }, []);

  const filtered = products.filter((p) => {
    if (activeOnly && !Boolean(p.is_active)) return false;
    const low = Number(p.low_stock_count ?? 0) > 0;
    if (lowStockOnly && !low) return false;
    if (!q.trim()) return true;
    const needle = q.trim().toLowerCase();
    return (p.name ?? "").toLowerCase().includes(needle) || (p.sku ?? "").toLowerCase().includes(needle);
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Products</h2>
        <Link href="/admin/products/new" className="text-accent underline">
          New
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <div className="min-w-[240px] flex-1">
          <Input label="Search" placeholder="Name or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <label className="mt-7 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--accent)]"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          Active only
        </label>
        <label className="mt-7 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--accent)]"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
          Low stock only
        </label>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
              <th className="py-2">Name</th>
              <th>SKU</th>
              <th>Status</th>
              <th>Variants</th>
              <th>Low stock</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const low = Number(p.low_stock_count ?? 0);
              return (
                <tr key={p.id} className="border-b border-[var(--border)]">
                  <td className="py-3 font-medium">{p.name}</td>
                  <td className="font-mono text-xs">{p.sku}</td>
                  <td>
                    <Badge variant={p.is_active ? "success" : "neutral"}>{p.is_active ? "active" : "inactive"}</Badge>
                  </td>
                  <td className="font-mono text-xs">{Number(p.variant_count ?? 0)}</td>
                  <td>{low > 0 ? <Badge variant="danger">{low} variant(s)</Badge> : <span className="text-[var(--text-muted)]">—</span>}</td>
                  <td className="text-right">
                    <Link href={`/admin/products/${p.id}/edit`} className="text-accent underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
