"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  scientific_name: string | null;
  category_id: string;
  images: string[];
  base_price: number;
  compare_price_at: number | null;
  cost_of_goods: number | null;
  sku: string;
  purity: number | null;
  molecular_formula: string | null;
  cas_number: string | null;
  storage_instructions: string | null;
  cycle_length_days: number | null;
  is_active: number;
  is_featured: number;
  is_best_seller: number;
  subscription_eligible: number;
  subscription_discount: number;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  created_at: number;
};

type AdminVariant = {
  id: string;
  product_id: string;
  size: string;
  price: number;
  compare_at: number | null;
  sku: string;
  stock_qty: number;
  low_stock_threshold: number;
  is_default: boolean;
  display_order: number;
};

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [variants, setVariants] = useState<AdminVariant[]>([]);
  const [newVariant, setNewVariant] = useState<{ size: string; price: number; sku: string }>({ size: "", price: 0, sku: "" });
  const [adjustments, setAdjustments] = useState<Record<string, Array<{ id: string; delta: number; reason: string | null; created_at: number }>>>({});
  const [adjustDelta, setAdjustDelta] = useState<Record<string, number>>({});
  const [adjustReason, setAdjustReason] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState("");

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = (await res.json()) as { product: AdminProduct; variants: AdminVariant[] };
      setProduct(data.product);
      setVariants(data.variants ?? []);
      const variantIds = (data.variants ?? []).map((v) => v.id);
      const fetched = await Promise.all(
        variantIds.map(async (vid) => {
          const r = await fetch(`/api/admin/inventory/adjustments?variantId=${encodeURIComponent(vid)}&limit=10`);
          if (!r.ok) return [vid, []] as const;
          const j = (await r.json()) as { adjustments: Array<{ id: string; delta: number; reason: string | null; created_at: number }> };
          return [vid, j.adjustments ?? []] as const;
        })
      );
      setAdjustments(Object.fromEntries(fetched));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  const imageText = useMemo(() => (product?.images ?? []).join("\n"), [product?.images]);
  const tagText = useMemo(() => (product?.tags ?? []).join("\n"), [product?.tags]);

  async function save() {
    if (!product) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...product,
          images: imageText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          tags: tagText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const data = (await res.json()) as { product: AdminProduct };
      setProduct(data.product);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-sm text-[var(--text-muted)]">Loading…</div>;
  if (!product) return <div className="text-sm text-[var(--text-muted)]">Not found.</div>;

  const canDelete = deleteConfirm.trim().toLowerCase() === product.slug.trim().toLowerCase();

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">{product.name}</h2>
          <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">{product.id}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={load}>
            Refresh
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      {error ? <div className="rounded-[var(--radius)] border border-red-500/30 bg-red-500/10 p-3 text-sm">Error: {error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold">Core</h3>
            <div className="mt-4 grid gap-4">
              <Input label="Name" value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} />
              <Input label="Slug" value={product.slug} onChange={(e) => setProduct({ ...product, slug: e.target.value })} />
              <Input label="SKU" value={product.sku} onChange={(e) => setProduct({ ...product, sku: e.target.value })} />
              <Input label="Category ID" value={product.category_id} onChange={(e) => setProduct({ ...product, category_id: e.target.value })} />
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="mt-1 min-h-[140px] w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-3 text-sm"
                  value={product.description}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                />
              </div>
              <Input
                label="Short description"
                value={product.short_description ?? ""}
                onChange={(e) => setProduct({ ...product, short_description: e.target.value || null })}
              />
              <Input
                label="Scientific name"
                value={product.scientific_name ?? ""}
                onChange={(e) => setProduct({ ...product, scientific_name: e.target.value || null })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold">Pricing & flags</h3>
            <div className="mt-4 grid gap-4">
              <Input
                label="Base price"
                type="number"
                value={product.base_price}
                onChange={(e) => setProduct({ ...product, base_price: Number(e.target.value) })}
              />
              <Input
                label="Compare at"
                type="number"
                value={product.compare_price_at ?? ""}
                onChange={(e) => setProduct({ ...product, compare_price_at: e.target.value === "" ? null : Number(e.target.value) })}
              />
              <Input
                label="Cost of goods"
                type="number"
                value={product.cost_of_goods ?? ""}
                onChange={(e) => setProduct({ ...product, cost_of_goods: e.target.value === "" ? null : Number(e.target.value) })}
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--accent)]"
                    checked={Boolean(product.is_active)}
                    onChange={(e) => setProduct({ ...product, is_active: e.target.checked ? 1 : 0 })}
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--accent)]"
                    checked={Boolean(product.is_featured)}
                    onChange={(e) => setProduct({ ...product, is_featured: e.target.checked ? 1 : 0 })}
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--accent)]"
                    checked={Boolean(product.is_best_seller)}
                    onChange={(e) => setProduct({ ...product, is_best_seller: e.target.checked ? 1 : 0 })}
                  />
                  Best seller
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--accent)]"
                    checked={Boolean(product.subscription_eligible)}
                    onChange={(e) => setProduct({ ...product, subscription_eligible: e.target.checked ? 1 : 0 })}
                  />
                  Subscription
                </label>
              </div>
              <Input
                label="Subscription discount (0–1)"
                type="number"
                value={product.subscription_discount}
                onChange={(e) => setProduct({ ...product, subscription_discount: Number(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-semibold">Images (one per line)</h3>
          <textarea
            className="mt-4 min-h-[120px] w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-3 font-mono text-xs"
            value={imageText}
            onChange={(e) => setProduct({ ...product, images: e.target.value.split("\n") })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-semibold">Tags (one per line)</h3>
          <textarea
            className="mt-4 min-h-[120px] w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-3 font-mono text-xs"
            value={tagText}
            onChange={(e) => setProduct({ ...product, tags: e.target.value.split("\n") })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-semibold">Variants</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Manage variants and default selection.</p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Input label="Size" value={newVariant.size} onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })} />
            <Input
              label="Price"
              type="number"
              value={newVariant.price || ""}
              onChange={(e) => setNewVariant({ ...newVariant, price: Number(e.target.value) })}
            />
            <Input label="SKU" value={newVariant.sku} onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                const res = await fetch(`/api/admin/products/${id}/variants`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ size: newVariant.size, price: newVariant.price, sku: newVariant.sku }),
                });
                if (res.ok) {
                  setNewVariant({ size: "", price: 0, sku: "" });
                  await load();
                } else {
                  setError(`Create variant failed (${res.status})`);
                }
              }}
              disabled={!newVariant.size.trim() || !newVariant.sku.trim() || newVariant.price <= 0}
            >
              Add variant
            </Button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="py-2">SKU</th>
                  <th>Size</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Default</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.id} className="border-b border-[var(--border)]">
                    <td className="py-3 font-mono text-xs">{v.sku}</td>
                    <td>{v.size}</td>
                    <td className="font-mono text-xs">{v.price}</td>
                    <td className="font-mono text-xs">{v.stock_qty}</td>
                    <td>{v.is_default ? "Yes" : "—"}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        {!v.is_default ? (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={async () => {
                              const res = await fetch(`/api/admin/products/${id}/variants/${v.id}/make-default`, { method: "POST" });
                              if (res.ok) await load();
                              else setError(`Make default failed (${res.status})`);
                            }}
                          >
                            Make default
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="danger"
                          onClick={async () => {
                            const res = await fetch(`/api/admin/variants/${v.id}`, { method: "DELETE" });
                            if (res.ok) await load();
                            else setError(`Delete failed (${res.status})`);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-semibold">Inventory adjustments</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Apply stock deltas and keep an audit trail per variant.</p>

          <div className="mt-4 space-y-6">
            {variants.map((v) => {
              const list = adjustments[v.id] ?? [];
              const delta = adjustDelta[v.id] ?? 0;
              const reason = adjustReason[v.id] ?? "";
              return (
                <div key={v.id} className="rounded-[var(--radius)] border border-[var(--border)] bg-surface p-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="font-medium">{v.size}</p>
                      <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">{v.sku}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">Current stock: {v.stock_qty}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="min-w-[140px]">
                        <Input
                          label="Delta"
                          type="number"
                          value={delta || ""}
                          onChange={(e) => setAdjustDelta({ ...adjustDelta, [v.id]: Number(e.target.value) })}
                        />
                      </div>
                      <div className="min-w-[220px]">
                        <Input label="Reason" value={reason} onChange={(e) => setAdjustReason({ ...adjustReason, [v.id]: e.target.value })} />
                      </div>
                      <div className="mt-7">
                        <Button
                          type="button"
                          onClick={async () => {
                            const res = await fetch("/api/admin/inventory/adjustments", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ variantId: v.id, delta, reason: reason || undefined }),
                            });
                            if (!res.ok) {
                              setError(`Adjustment failed (${res.status})`);
                              return;
                            }
                            setAdjustDelta({ ...adjustDelta, [v.id]: 0 });
                            setAdjustReason({ ...adjustReason, [v.id]: "" });
                            await load();
                          }}
                          disabled={!delta}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                          <th className="py-2">When</th>
                          <th>Delta</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.length ? (
                          list.map((a) => (
                            <tr key={a.id} className="border-b border-[var(--border)]">
                              <td className="py-2">{formatDate(a.created_at)}</td>
                              <td className="font-mono">{a.delta}</td>
                              <td>{a.reason ?? "—"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="py-3 text-sm text-[var(--text-muted)]" colSpan={3}>
                              No adjustments yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-semibold text-red-600">Danger zone</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            This permanently deletes the product and its dependent data (variants, lab reports, reviews, bundle items, related products, subscription items,
            inventory adjustments). Orders will keep historical line items in JSON.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Input
              label={`Type the product slug to confirm (${product.slug})`}
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={product.slug}
            />
            <div className="md:mt-7">
              <Button
                type="button"
                variant="danger"
                disabled={!canDelete || deleting}
                onClick={async () => {
                  setDeleting(true);
                  setError(null);
                  try {
                    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
                    if (!res.ok) throw new Error(`Delete failed (${res.status})`);
                    router.push("/admin/products");
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Delete failed");
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? "Deleting…" : "Delete product"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
