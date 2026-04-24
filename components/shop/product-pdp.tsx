"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { VariantSelector, type VariantOption } from "@/components/ui/variant-selector";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Input } from "@/components/ui/input";
import {
  getProductShopGridBackgroundCss,
  getShopGridImageObjectPosition,
  getShopGridProductImage,
} from "@/lib/product-pdp-theme";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/lib/cart";
import { useCartStore } from "@/store/cart-store";
import { RatingStars } from "@/components/ui/rating-stars";
import { parseProductMeta } from "@/lib/product-meta";
import { buildPdpSpecificationRows } from "@/lib/product-specifications";
import { ProductCard } from "@/components/ui/product-card";
import { CoaRequestForm } from "@/components/shop/coa-request-form";
import { emitAdminUpdate } from "@/components/providers/admin-update-bus";
import { formatDate } from "@/lib/utils";

const RECENT_KEY = "peptide_recently_viewed";

type PdpProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  scientificName: string | null;
  categoryName: string;
  categorySlug: string;
  images: string[];
  basePrice: number;
  comparePriceAt: number | null;
  purity: number | null;
  molecularFormula: string | null;
  casNumber: string | null;
  storageInstructions: string | null;
  cycleLengthDays: number | null;
  subscriptionEligible: boolean;
  subscriptionDiscount: number;
  tags: string[];
};

type ProductPdpProps = {
  /** Hero URL (matches `/shop` grid — shop listing overrides + canonical). */
  heroImage: string;
  isAdmin?: boolean;
  adminEditProductId?: string;
  product: PdpProduct;
  variants: Array<{
    id: string;
    size: string;
    price: number;
    compareAt: number | null;
    stockQty: number;
    lowStockThreshold: number;
  }>;
  labReports: Array<{
    labName: string;
    batchNumber: string;
    purity: number;
    reportUrl: string;
    testedAt: number;
    isCurrent: boolean;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    title: string | null;
    body: string;
    userName: string | null;
  }>;
  related: Array<{
    id: string;
    name: string;
    slug: string;
    images: string[];
    purity: number | null;
    price: number;
    compareAt: number | null;
    variant_id: string;
    size: string;
  }>;
};

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
  category?: { id: string; name: string; slug: string } | null;
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

function adminVariantToPdpVariant(v: AdminVariant): ProductPdpProps["variants"][number] {
  return {
    id: v.id,
    size: v.size,
    price: v.price,
    compareAt: v.compare_at,
    stockQty: v.stock_qty,
    lowStockThreshold: v.low_stock_threshold,
  };
}

type AdminLabReport = {
  id: string;
  productId: string;
  batchNumber: string;
  labName: string;
  purity: number;
  reportUrl: string;
  testedAt: number;
  isCurrent: boolean;
  createdAt: number;
};

type AdminReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: number;
  userName: string | null;
  userEmail: string | null;
};

function adminToPdpProduct(admin: AdminProduct): PdpProduct {
  return {
    id: admin.id,
    name: admin.name,
    slug: admin.slug,
    description: admin.description,
    shortDescription: admin.short_description,
    scientificName: admin.scientific_name,
    categoryName: admin.category?.name ?? "",
    categorySlug: admin.category?.slug ?? "",
    images: admin.images ?? [],
    basePrice: admin.base_price,
    comparePriceAt: admin.compare_price_at,
    purity: admin.purity,
    molecularFormula: admin.molecular_formula,
    casNumber: admin.cas_number,
    storageInstructions: admin.storage_instructions,
    cycleLengthDays: admin.cycle_length_days,
    subscriptionEligible: Boolean(admin.subscription_eligible),
    subscriptionDiscount: admin.subscription_discount,
    tags: admin.tags ?? [],
  };
}

function pdpToAdminPatch(p: PdpProduct): Partial<AdminProduct> {
  const basePrice = Number(p.basePrice);
  const compareAt = p.comparePriceAt === null ? null : Number(p.comparePriceAt);
  const basePriceOk = Number.isFinite(basePrice) && basePrice > 0;
  const compareAtOk = compareAt === null || (Number.isFinite(compareAt) && compareAt > 0);

  return {
    name: p.name,
    slug: p.slug,
    description: p.description,
    short_description: p.shortDescription ?? null,
    scientific_name: p.scientificName ?? null,
    images: p.images ?? [],
    ...(basePriceOk ? { base_price: basePrice } : {}),
    ...(compareAtOk ? { compare_price_at: compareAt } : {}),
    purity: p.purity ?? null,
    molecular_formula: p.molecularFormula ?? null,
    cas_number: p.casNumber ?? null,
    storage_instructions: p.storageInstructions ?? null,
    cycle_length_days: p.cycleLengthDays ?? null,
    subscription_eligible: p.subscriptionEligible ? 1 : 0,
    subscription_discount: p.subscriptionDiscount ?? 0,
    tags: p.tags ?? [],
  };
}

export function ProductPdp(props: ProductPdpProps) {
  const { heroImage, product, variants, labReports, reviews, related, isAdmin, adminEditProductId } = props;
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [viewProduct, setViewProduct] = useState(product);
  const [draftProduct, setDraftProduct] = useState(product);
  const [viewVariants, setViewVariants] = useState(variants);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [adminVariants, setAdminVariants] = useState<AdminVariant[]>([]);
  const [adminLabReports, setAdminLabReports] = useState<AdminLabReport[]>([]);
  const [pendingReviews, setPendingReviews] = useState<AdminReview[]>([]);
  const [approvedReviews, setApprovedReviews] = useState<AdminReview[]>([]);
  const [newLabReport, setNewLabReport] = useState<{ batchNumber: string; labName: string; purity: number; reportUrl: string; testedAt: string; isCurrent: boolean }>({
    batchNumber: "",
    labName: "",
    purity: 99,
    reportUrl: "",
    testedAt: "",
    isCurrent: true,
  });
  const [newVariant, setNewVariant] = useState<{ size: string; price: number; sku: string }>({ size: "", price: 0, sku: "" });
  const [adjustments, setAdjustments] = useState<Record<string, Array<{ id: string; delta: number; reason: string | null; created_at: number }>>>({});
  const [adjustDelta, setAdjustDelta] = useState<Record<string, number>>({});
  const [adjustReason, setAdjustReason] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(variants.find((v) => v.stockQty > 0)?.id ?? variants[0]?.id);
  const [qtyInput, setQtyInput] = useState("1");
  const addItem = useCartStore((s) => s.addItem);

  const selected = useMemo(() => viewVariants.find((v) => v.id === selectedId) ?? viewVariants[0], [viewVariants, selectedId]);
  const variantOpts: VariantOption[] = viewVariants.map((v) => ({
    id: v.id,
    size: v.size,
    price: v.price,
    compareAt: v.compareAt,
    inStock: v.stockQty > 0,
  }));

  const parsedQty = Number(qtyInput);
  const qty = Number.isFinite(parsedQty) && parsedQty >= 0 ? parsedQty : 0;
  const displayPrice = selected.price;
  const meta = useMemo(() => parseProductMeta(viewProduct.tags), [viewProduct.tags]);
  const specificationRows = useMemo(
    () =>
      buildPdpSpecificationRows({
        slug: viewProduct.slug,
        name: viewProduct.name,
        scientificName: viewProduct.scientificName,
        selectedSize: selected.size,
        meta,
      }),
    [viewProduct.slug, viewProduct.name, viewProduct.scientificName, selected.size, meta],
  );
  const normalizedScientific = (viewProduct.scientificName ?? "").trim().toLowerCase();
  const normalizedName = viewProduct.name.trim().toLowerCase();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const next = [viewProduct.slug, ...list.filter((s) => s !== viewProduct.slug)].slice(0, 8);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [viewProduct.slug]);

  useEffect(() => {
    setViewProduct(product);
    setDraftProduct(product);
    setViewVariants(variants);
    setDraftLoaded(false);
    setEditError(null);
    setEditMode(false);
    setSelectedId(variants.find((v) => v.stockQty > 0)?.id ?? variants[0]?.id);
  }, [product, variants]);

  useEffect(() => {
    if (!editMode) return;
    if (!isAdmin || !adminEditProductId) return;
    if (draftLoaded) return;
    let cancelled = false;
    setEditError(null);
    (async () => {
      try {
        const res = await fetch(`/api/admin/products/${encodeURIComponent(adminEditProductId)}`);
        if (!res.ok) throw new Error(`Failed to load admin product (${res.status})`);
        const data = (await res.json()) as { product: AdminProduct; variants: AdminVariant[] };
        if (cancelled) return;
        const mapped = adminToPdpProduct(data.product);
        setDraftProduct(mapped);
        setViewProduct((prev) => ({ ...prev, ...mapped }));
        setAdminVariants(data.variants ?? []);
        setViewVariants((data.variants ?? []).map(adminVariantToPdpVariant));
        const variantIds = (data.variants ?? []).map((v) => v.id);
        const fetched = await Promise.all(
          variantIds.map(async (vid) => {
            const r = await fetch(`/api/admin/inventory/adjustments?variantId=${encodeURIComponent(vid)}&limit=10`);
            if (!r.ok) return [vid, []] as const;
            const j = (await r.json()) as { adjustments: Array<{ id: string; delta: number; reason: string | null; created_at: number }> };
            return [vid, j.adjustments ?? []] as const;
          })
        );
        if (cancelled) return;
        setAdjustments(Object.fromEntries(fetched));
        const lrRes = await fetch(`/api/admin/products/${encodeURIComponent(adminEditProductId)}/lab-reports`);
        if (lrRes.ok) {
          const lrData = (await lrRes.json()) as { labReports: AdminLabReport[] };
          if (!cancelled) setAdminLabReports(lrData.labReports ?? []);
        }
        const [pendingRes, approvedRes] = await Promise.all([
          fetch(`/api/admin/reviews?productId=${encodeURIComponent(adminEditProductId)}&status=pending`),
          fetch(`/api/admin/reviews?productId=${encodeURIComponent(adminEditProductId)}&status=approved`),
        ]);
        if (pendingRes.ok) {
          const pr = (await pendingRes.json()) as { reviews: AdminReview[] };
          if (!cancelled) setPendingReviews(pr.reviews ?? []);
        }
        if (approvedRes.ok) {
          const ar = (await approvedRes.json()) as { reviews: AdminReview[] };
          if (!cancelled) setApprovedReviews(ar.reviews ?? []);
        }
        setDraftLoaded(true);
      } catch (e) {
        if (cancelled) return;
        setEditError(e instanceof Error ? e.message : "Failed to load admin product");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminEditProductId, draftLoaded, editMode, isAdmin]);

  async function reloadAdmin() {
    if (!isAdmin || !adminEditProductId) return;
    const res = await fetch(`/api/admin/products/${encodeURIComponent(adminEditProductId)}`);
    if (!res.ok) throw new Error(`Failed to reload admin product (${res.status})`);
    const data = (await res.json()) as { product: AdminProduct; variants: AdminVariant[] };
    const mapped = adminToPdpProduct(data.product);
    setViewProduct((prev) => ({ ...prev, ...mapped }));
    setDraftProduct((prev) => ({ ...prev, ...mapped }));
    setAdminVariants(data.variants ?? []);
    setViewVariants((data.variants ?? []).map(adminVariantToPdpVariant));
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
    const lrRes = await fetch(`/api/admin/products/${encodeURIComponent(adminEditProductId)}/lab-reports`);
    if (lrRes.ok) {
      const lrData = (await lrRes.json()) as { labReports: AdminLabReport[] };
      setAdminLabReports(lrData.labReports ?? []);
    }
    const [pendingRes, approvedRes] = await Promise.all([
      fetch(`/api/admin/reviews?productId=${encodeURIComponent(adminEditProductId)}&status=pending`),
      fetch(`/api/admin/reviews?productId=${encodeURIComponent(adminEditProductId)}&status=approved`),
    ]);
    if (pendingRes.ok) {
      const pr = (await pendingRes.json()) as { reviews: AdminReview[] };
      setPendingReviews(pr.reviews ?? []);
    }
    if (approvedRes.ok) {
      const ar = (await approvedRes.json()) as { reviews: AdminReview[] };
      setApprovedReviews(ar.reviews ?? []);
    }
  }

  async function saveEdits() {
    if (!isAdmin || !adminEditProductId) return;
    setSaving(true);
    setEditError(null);
    try {
      // Storefront pricing comes from the default variant; keep it in sync with basePrice when edited here.
      const nextBase = Number(draftProduct.basePrice);
      const baseOk = Number.isFinite(nextBase) && nextBase > 0;
      const defaultVariant = adminVariants.find((v) => v.is_default) ?? adminVariants[0];
      if (baseOk && defaultVariant && Number(defaultVariant.price) !== nextBase) {
        const vr = await fetch(`/api/admin/variants/${encodeURIComponent(defaultVariant.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ price: nextBase }),
        });
        if (!vr.ok) throw new Error(`Save failed (${vr.status})`);
      }

      const payload = pdpToAdminPatch(draftProduct);
      const res = await fetch(`/api/admin/products/${encodeURIComponent(adminEditProductId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const data = (await res.json()) as { product: AdminProduct };
      const mapped = adminToPdpProduct(data.product);
      setViewProduct((prev) => ({ ...prev, ...mapped }));
      setDraftProduct((prev) => ({ ...prev, ...mapped }));
      setEditMode(false);
      router.refresh();
      emitAdminUpdate({ productId: adminEditProductId });
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdits() {
    setEditError(null);
    setDraftProduct(viewProduct);
    setEditMode(false);
  }

  function addToCart() {
    const img = heroImage;
    const item: CartItem = {
      productId: viewProduct.id,
      variantId: selected.id,
      name: viewProduct.name,
      slug: viewProduct.slug,
      size: selected.size,
      price: selected.price,
      image: img,
      quantity: qty,
    };
    addItem(item);
  }

  const heroFrameBg = getProductShopGridBackgroundCss(viewProduct.slug);
  const heroObjectPosition = getShopGridImageObjectPosition(viewProduct.slug);
  const currentLab = labReports.find((l) => l.isCurrent) ?? labReports[0];
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null;

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-28 pt-10 md:grid-cols-[minmax(240px,360px)_1fr] md:items-start md:pb-36">
      <div className="space-y-4 md:sticky md:top-24">
        <div
          className={`relative mx-auto aspect-[3/4] w-full max-w-[340px] overflow-hidden rounded-[var(--radius)] border border-[var(--border)] shadow-sm ${heroFrameBg ? "" : "bg-[var(--surface-2)]"}`}
          style={heroFrameBg ? { background: heroFrameBg } : undefined}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- fills portrait frame (wide assets use cover, not letterbox) */}
          <img
            src={heroImage}
            alt={viewProduct.name}
            className={`absolute inset-0 z-[1] h-full w-full object-cover transition duration-300 hover:scale-[1.02] [background:none] ${heroObjectPosition ? "" : "object-center"}`}
            style={heroObjectPosition ? { objectPosition: heroObjectPosition } : undefined}
            loading="eager"
            decoding="async"
          />
        </div>
        <Disclaimer />
      </div>
      <div>
        <p className="text-sm text-[var(--text-muted)]">
          <Link href={`/shop/${viewProduct.categorySlug}`} className="hover:text-accent">
            {viewProduct.categoryName}
          </Link>
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          {editMode ? (
            <div className="min-w-[260px] flex-1">
              <Input label="Name" value={draftProduct.name} onChange={(e) => setDraftProduct({ ...draftProduct, name: e.target.value })} />
            </div>
          ) : (
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">{viewProduct.name}</h1>
          )}
          {isAdmin && adminEditProductId ? (
            <div className="flex items-center gap-2">
              {editMode ? (
                <>
                  <Button type="button" variant="secondary" size="sm" onClick={cancelEdits} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={saveEdits} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </>
              ) : (
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                  Edit
                </Button>
              )}
            </div>
          ) : null}
        </div>
        {editError ? <p className="mt-3 rounded-[var(--radius)] border border-red-500/30 bg-red-500/10 p-3 text-sm">Error: {editError}</p> : null}
        {editMode ? (
          <div className="mt-3 grid gap-3">
            <div>
              <label className="text-sm font-medium">Short description</label>
              <textarea
                className="mt-1 min-h-[90px] w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-3 text-sm"
                value={draftProduct.shortDescription ?? ""}
                onChange={(e) => setDraftProduct({ ...draftProduct, shortDescription: e.target.value || null })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="mt-1 min-h-[140px] w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-3 text-sm"
                value={draftProduct.description}
                onChange={(e) => setDraftProduct({ ...draftProduct, description: e.target.value })}
              />
            </div>
            <Input
              label="Scientific name"
              value={draftProduct.scientificName ?? ""}
              onChange={(e) => setDraftProduct({ ...draftProduct, scientificName: e.target.value || null })}
            />
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{viewProduct.shortDescription ?? viewProduct.description}</p>
            {viewProduct.scientificName && normalizedScientific !== normalizedName ? (
              <p className="mt-2 font-mono text-sm text-[var(--text-muted)]">{viewProduct.scientificName}</p>
            ) : null}
          </>
        )}
        {meta.aliases.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {meta.aliases.map((alias) => (
              <span
                key={alias}
                className="rounded-full border border-[var(--border)] bg-surface-2 px-3 py-1 text-xs text-[var(--text-muted)]"
              >
                {alias}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-6 grid gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Type", value: meta.type },
            { label: "Category", value: meta.family },
            { label: "Batch", value: meta.batch },
            { label: "Batch number", value: currentLab?.batchNumber ?? "—", mono: true },
            { label: "Tested date", value: currentLab ? new Date(currentLab.testedAt * 1000).toLocaleDateString() : "—", mono: true },
          ].map((item) => (
            <div key={item.label} className="rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">{item.label}</p>
              <p className={item.mono ? "mt-1 font-mono text-sm" : "mt-1 text-sm"}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-sm font-medium">Size</p>
            <VariantSelector variants={variantOpts} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Quantity</p>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              onBlur={() => {
                if (qtyInput.trim() === "") {
                  setQtyInput("0");
                  return;
                }
                const next = Number(qtyInput);
                if (!Number.isFinite(next) || next < 0) setQtyInput("0");
              }}
              className="mt-1 h-10 w-16 rounded-[var(--radius)] border border-accent/40 bg-surface-2 px-2 text-center font-mono text-sm shadow-[0_0_0_1px_rgba(169,212,236,0.22),0_0_22px_rgba(169,212,236,0.22)] outline-none transition focus:border-accent/70 focus:shadow-[0_0_0_1px_rgba(169,212,236,0.4),0_0_26px_rgba(169,212,236,0.3)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-baseline gap-3">
          <span className="font-mono text-3xl">{formatCurrency(displayPrice * qty)}</span>
          {selected.compareAt && selected.compareAt > selected.price ? (
            <span className="font-mono text-lg text-[var(--text-muted)] line-through">
              {formatCurrency(selected.compareAt * qty)}
            </span>
          ) : null}
        </div>
        {editMode ? (
          <div className="mt-4 grid gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-3 sm:grid-cols-2">
            <Input
              label="Base price"
              type="number"
              value={draftProduct.basePrice}
              onChange={(e) => setDraftProduct({ ...draftProduct, basePrice: e.target.value === "" ? (NaN as unknown as number) : Number(e.target.value) })}
            />
            <Input
              label="Compare at"
              type="number"
              value={draftProduct.comparePriceAt ?? ""}
              onChange={(e) => setDraftProduct({ ...draftProduct, comparePriceAt: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </div>
        ) : null}
        {qty >= 3 ? (
          <p className="mt-2 text-sm text-accent">Buy 3+ of the same variant — 10% off at checkout (bulk discount).</p>
        ) : null}
        <Button className="mt-6 w-full lg:sticky lg:bottom-4" size="lg" type="button" onClick={addToCart} disabled={qty <= 0}>
          Add to cart
        </Button>

        <section className="mt-12 space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-5">
          <div>
            <h2 className="font-display text-xl font-semibold">Overview</h2>
            {editMode ? (
              <textarea
                className="mt-2 min-h-[140px] w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-3 text-sm"
                value={draftProduct.description}
                onChange={(e) => setDraftProduct({ ...draftProduct, description: e.target.value })}
              />
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{viewProduct.description}</p>
            )}
          </div>
          <div className="border-t border-[var(--border)] pt-4">
            <h2 className="font-display text-xl font-semibold">Compound overview</h2>
            {editMode ? (
              <textarea
                className="mt-2 min-h-[110px] w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-3 text-sm"
                value={draftProduct.shortDescription ?? ""}
                onChange={(e) => setDraftProduct({ ...draftProduct, shortDescription: e.target.value || null })}
              />
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {viewProduct.shortDescription ?? viewProduct.description}
              </p>
            )}
          </div>
          <div className="border-t border-[var(--border)] pt-4">
            <h2 className="font-display text-xl font-semibold">Storage &amp; handling</h2>
            {editMode ? (
              <textarea
                className="mt-2 min-h-[110px] w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-3 text-sm"
                value={draftProduct.storageInstructions ?? ""}
                onChange={(e) => setDraftProduct({ ...draftProduct, storageInstructions: e.target.value || null })}
              />
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {viewProduct.storageInstructions ??
                  "Store lyophilized material per label and COA. Solvent selection and working-solution preparation must follow institutional laboratory SOPs for analytical workflows."}
              </p>
            )}
          </div>
          <div className="border-t border-[var(--border)] pt-4">
            <h2 className="font-display text-xl font-semibold">Specifications</h2>
            <table className="mt-2 w-full text-left text-sm">
              <tbody className="divide-y divide-[var(--border)]">
                {specificationRows.map((spec) => (
                  <tr key={`${spec.label}:${spec.value}`}>
                    <th className="py-2 text-[var(--text-muted)]">{spec.label}</th>
                    <td className="font-mono">{spec.value}</td>
                  </tr>
                ))}
                {editMode ? (
                  <>
                    <tr>
                      <th className="py-2 text-[var(--text-muted)]">Molecular formula</th>
                      <td className="py-2">
                        <Input
                          label=""
                          value={draftProduct.molecularFormula ?? ""}
                          onChange={(e) => setDraftProduct({ ...draftProduct, molecularFormula: e.target.value || null })}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="py-2 text-[var(--text-muted)]">CAS</th>
                      <td className="py-2">
                        <Input label="" value={draftProduct.casNumber ?? ""} onChange={(e) => setDraftProduct({ ...draftProduct, casNumber: e.target.value || null })} />
                      </td>
                    </tr>
                    <tr>
                      <th className="py-2 text-[var(--text-muted)]">Purity (%)</th>
                      <td className="py-2">
                        <Input
                          label=""
                          type="number"
                          value={draftProduct.purity ?? ""}
                          onChange={(e) => setDraftProduct({ ...draftProduct, purity: e.target.value === "" ? null : Number(e.target.value) })}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="py-2 text-[var(--text-muted)]">Catalog reference period (days)</th>
                      <td className="py-2">
                        <Input
                          label=""
                          type="number"
                          value={draftProduct.cycleLengthDays ?? ""}
                          onChange={(e) => setDraftProduct({ ...draftProduct, cycleLengthDays: e.target.value === "" ? null : Number(e.target.value) })}
                        />
                      </td>
                    </tr>
                  </>
                ) : viewProduct.molecularFormula ? (
                  <tr>
                    <th className="py-2 text-[var(--text-muted)]">Molecular formula</th>
                    <td className="font-mono">{viewProduct.molecularFormula}</td>
                  </tr>
                ) : null}
                {!editMode && viewProduct.casNumber ? (
                  <tr>
                    <th className="py-2 text-[var(--text-muted)]">CAS</th>
                    <td className="font-mono">{viewProduct.casNumber}</td>
                  </tr>
                ) : null}
                {!editMode && viewProduct.purity != null ? (
                  <tr>
                    <th className="py-2 text-[var(--text-muted)]">Purity</th>
                    <td className="font-mono">{viewProduct.purity}%</td>
                  </tr>
                ) : null}
                {!editMode && viewProduct.cycleLengthDays != null ? (
                  <tr>
                    <th className="py-2 text-[var(--text-muted)]">Catalog reference period</th>
                    <td className="font-mono">{viewProduct.cycleLengthDays} days</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {editMode && isAdmin && adminEditProductId ? (
          <section className="mt-12 space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-5">
            <h2 className="font-display text-xl font-semibold">Admin: Variants</h2>
            <p className="text-sm text-[var(--text-muted)]">Manage variants and default selection.</p>

            <div className="grid gap-3 md:grid-cols-3">
              <Input label="Size" value={newVariant.size} onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })} />
              <Input
                label="Price"
                type="number"
                value={newVariant.price || ""}
                onChange={(e) => setNewVariant({ ...newVariant, price: Number(e.target.value) })}
              />
              <Input label="SKU" value={newVariant.sku} onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={!newVariant.size.trim() || !newVariant.sku.trim() || newVariant.price <= 0}
                onClick={async () => {
                  setEditError(null);
                  try {
                    const res = await fetch(`/api/admin/products/${encodeURIComponent(adminEditProductId)}/variants`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ size: newVariant.size, price: newVariant.price, sku: newVariant.sku }),
                    });
                    if (!res.ok) throw new Error(`Create variant failed (${res.status})`);
                    setNewVariant({ size: "", price: 0, sku: "" });
                    await reloadAdmin();
                    emitAdminUpdate({ productId: adminEditProductId });
                  } catch (e) {
                    setEditError(e instanceof Error ? e.message : "Create variant failed");
                  }
                }}
              >
                Add variant
              </Button>
            </div>

            <div className="overflow-x-auto">
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
                  {adminVariants.map((v) => (
                    <tr key={v.id} className="border-b border-[var(--border)]">
                      <td className="py-3 font-mono text-xs">{v.sku}</td>
                      <td>{v.size}</td>
                      <td className="font-mono text-xs">
                        <input
                          type="number"
                          className="w-28 rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 px-2 py-1 text-sm"
                          value={v.price}
                          onChange={(e) =>
                            setAdminVariants((prev) => prev.map((x) => (x.id === v.id ? { ...x, price: Number(e.target.value) } : x)))
                          }
                        />
                      </td>
                      <td className="font-mono text-xs">{v.stock_qty}</td>
                      <td>{v.is_default ? "Yes" : "—"}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={async () => {
                              setEditError(null);
                              try {
                                const res = await fetch(`/api/admin/variants/${encodeURIComponent(v.id)}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ price: v.price }),
                                });
                                if (!res.ok) throw new Error(`Save variant failed (${res.status})`);
                                await reloadAdmin();
                                emitAdminUpdate({ productId: adminEditProductId });
                              } catch (e) {
                                setEditError(e instanceof Error ? e.message : "Save variant failed");
                              }
                            }}
                          >
                            Save
                          </Button>
                          {!v.is_default ? (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={async () => {
                                setEditError(null);
                                try {
                                  const res = await fetch(
                                    `/api/admin/products/${encodeURIComponent(adminEditProductId)}/variants/${encodeURIComponent(v.id)}/make-default`,
                                    { method: "POST" }
                                  );
                                  if (!res.ok) throw new Error(`Make default failed (${res.status})`);
                                  await reloadAdmin();
                                  emitAdminUpdate({ productId: adminEditProductId });
                                } catch (e) {
                                  setEditError(e instanceof Error ? e.message : "Make default failed");
                                }
                              }}
                            >
                              Make default
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="danger"
                            onClick={async () => {
                              setEditError(null);
                              try {
                                const res = await fetch(`/api/admin/variants/${encodeURIComponent(v.id)}`, { method: "DELETE" });
                                if (!res.ok) throw new Error(`Delete failed (${res.status})`);
                                await reloadAdmin();
                                emitAdminUpdate({ productId: adminEditProductId });
                              } catch (e) {
                                setEditError(e instanceof Error ? e.message : "Delete failed");
                              }
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
          </section>
        ) : null}

        {editMode && isAdmin && adminEditProductId ? (
          <section className="mt-6 space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-5">
            <h2 className="font-display text-xl font-semibold">Admin: Lab reports (COAs)</h2>
            <p className="text-sm text-[var(--text-muted)]">Add/update lab reports and pick the current report.</p>

            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Batch number" value={newLabReport.batchNumber} onChange={(e) => setNewLabReport({ ...newLabReport, batchNumber: e.target.value })} />
              <Input label="Lab name" value={newLabReport.labName} onChange={(e) => setNewLabReport({ ...newLabReport, labName: e.target.value })} />
              <Input
                label="Purity (%)"
                type="number"
                value={newLabReport.purity}
                onChange={(e) => setNewLabReport({ ...newLabReport, purity: Number(e.target.value) })}
              />
              <Input
                label="Tested date"
                type="date"
                value={newLabReport.testedAt}
                onChange={(e) => setNewLabReport({ ...newLabReport, testedAt: e.target.value })}
              />
              <div className="md:col-span-2">
                <Input label="Report URL" value={newLabReport.reportUrl} onChange={(e) => setNewLabReport({ ...newLabReport, reportUrl: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--accent)]"
                  checked={newLabReport.isCurrent}
                  onChange={(e) => setNewLabReport({ ...newLabReport, isCurrent: e.target.checked })}
                />
                Set as current
              </label>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={!newLabReport.batchNumber.trim() || !newLabReport.labName.trim() || !newLabReport.reportUrl.trim() || !newLabReport.testedAt}
                onClick={async () => {
                  setEditError(null);
                  try {
                    const testedAt = Math.floor(new Date(`${newLabReport.testedAt}T00:00:00Z`).getTime() / 1000);
                    const res = await fetch(`/api/admin/products/${encodeURIComponent(adminEditProductId)}/lab-reports`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        batchNumber: newLabReport.batchNumber,
                        labName: newLabReport.labName,
                        purity: newLabReport.purity,
                        reportUrl: newLabReport.reportUrl,
                        testedAt,
                        isCurrent: newLabReport.isCurrent,
                      }),
                    });
                    if (!res.ok) throw new Error(`Create lab report failed (${res.status})`);
                    setNewLabReport({ batchNumber: "", labName: "", purity: 99, reportUrl: "", testedAt: "", isCurrent: true });
                    await reloadAdmin();
                    emitAdminUpdate({ productId: adminEditProductId });
                  } catch (e) {
                    setEditError(e instanceof Error ? e.message : "Create lab report failed");
                  }
                }}
              >
                Add lab report
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                    <th className="py-2">Batch</th>
                    <th>Lab</th>
                    <th>Purity</th>
                    <th>Tested</th>
                    <th>Current</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {adminLabReports.map((lr) => {
                    const tested = new Date(lr.testedAt * 1000).toISOString().slice(0, 10);
                    return (
                      <tr key={lr.id} className="border-b border-[var(--border)]">
                        <td className="py-2">
                          <input
                            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 px-2 py-1 text-sm"
                            value={lr.batchNumber}
                            onChange={(e) =>
                              setAdminLabReports((prev) => prev.map((x) => (x.id === lr.id ? { ...x, batchNumber: e.target.value } : x)))
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 px-2 py-1 text-sm"
                            value={lr.labName}
                            onChange={(e) => setAdminLabReports((prev) => prev.map((x) => (x.id === lr.id ? { ...x, labName: e.target.value } : x)))}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="w-24 rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 px-2 py-1 text-sm"
                            value={lr.purity}
                            onChange={(e) =>
                              setAdminLabReports((prev) => prev.map((x) => (x.id === lr.id ? { ...x, purity: Number(e.target.value) } : x)))
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 px-2 py-1 text-sm"
                            value={tested}
                            onChange={(e) => {
                              const next = Math.floor(new Date(`${e.target.value}T00:00:00Z`).getTime() / 1000);
                              setAdminLabReports((prev) => prev.map((x) => (x.id === lr.id ? { ...x, testedAt: next } : x)));
                            }}
                          />
                        </td>
                        <td>{lr.isCurrent ? "Yes" : "—"}</td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            {!lr.isCurrent ? (
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={async () => {
                                  setEditError(null);
                                  try {
                                    const res = await fetch(`/api/admin/lab-reports/${encodeURIComponent(lr.id)}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ isCurrent: true }),
                                    });
                                    if (!res.ok) throw new Error(`Set current failed (${res.status})`);
                                    await reloadAdmin();
                                    emitAdminUpdate({ productId: adminEditProductId });
                                  } catch (e) {
                                    setEditError(e instanceof Error ? e.message : "Set current failed");
                                  }
                                }}
                              >
                                Make current
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={async () => {
                                setEditError(null);
                                try {
                                  const res = await fetch(`/api/admin/lab-reports/${encodeURIComponent(lr.id)}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      batchNumber: lr.batchNumber,
                                      labName: lr.labName,
                                      purity: lr.purity,
                                      testedAt: lr.testedAt,
                                      reportUrl: lr.reportUrl,
                                    }),
                                  });
                                  if (!res.ok) throw new Error(`Save lab report failed (${res.status})`);
                                  await reloadAdmin();
                                  emitAdminUpdate({ productId: adminEditProductId });
                                } catch (e) {
                                  setEditError(e instanceof Error ? e.message : "Save lab report failed");
                                }
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              onClick={async () => {
                                setEditError(null);
                                try {
                                  const res = await fetch(`/api/admin/lab-reports/${encodeURIComponent(lr.id)}`, { method: "DELETE" });
                                  if (!res.ok) throw new Error(`Delete failed (${res.status})`);
                                  await reloadAdmin();
                                  emitAdminUpdate({ productId: adminEditProductId });
                                } catch (e) {
                                  setEditError(e instanceof Error ? e.message : "Delete failed");
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {editMode && isAdmin && adminEditProductId ? (
          <section className="mt-6 space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-5">
            <h2 className="font-display text-xl font-semibold">Admin: Inventory adjustments</h2>
            <p className="text-sm text-[var(--text-muted)]">Apply stock deltas and keep an audit trail per variant.</p>
            <div className="space-y-6">
              {adminVariants.map((v) => {
                const list = adjustments[v.id] ?? [];
                const delta = adjustDelta[v.id] ?? 0;
                const reason = adjustReason[v.id] ?? "";
                return (
                  <div key={v.id} className="rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-4">
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
                              setEditError(null);
                              try {
                                const res = await fetch("/api/admin/inventory/adjustments", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ variantId: v.id, delta, reason: reason || undefined }),
                                });
                                if (!res.ok) throw new Error(`Adjustment failed (${res.status})`);
                                setAdjustDelta({ ...adjustDelta, [v.id]: 0 });
                                setAdjustReason({ ...adjustReason, [v.id]: "" });
                                await reloadAdmin();
                                emitAdminUpdate({ productId: adminEditProductId });
                              } catch (e) {
                                setEditError(e instanceof Error ? e.message : "Adjustment failed");
                              }
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
          </section>
        ) : null}

        {editMode && isAdmin && adminEditProductId ? (
          <section className="mt-6 space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-5">
            <h2 className="font-display text-xl font-semibold">Admin: Review moderation</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-4">
                <p className="font-medium">Pending ({pendingReviews.length})</p>
                <div className="mt-3 space-y-3">
                  {pendingReviews.length ? (
                    pendingReviews.map((r) => (
                      <div key={r.id} className="rounded-[var(--radius)] border border-[var(--border)] bg-surface p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            {r.userName ?? "User"} {r.userEmail ? <span className="text-[var(--text-muted)]">({r.userEmail})</span> : null}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">{formatDate(r.createdAt)}</p>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <RatingStars value={r.rating} />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={async () => {
                                setEditError(null);
                                try {
                                  const res = await fetch(`/api/reviews/${encodeURIComponent(r.id)}/approve`, { method: "PATCH" });
                                  if (!res.ok) throw new Error(`Approve failed (${res.status})`);
                                  await reloadAdmin();
                                  emitAdminUpdate({ productId: adminEditProductId });
                                } catch (e) {
                                  setEditError(e instanceof Error ? e.message : "Approve failed");
                                }
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              onClick={async () => {
                                setEditError(null);
                                try {
                                  const res = await fetch(`/api/admin/reviews/${encodeURIComponent(r.id)}`, { method: "DELETE" });
                                  if (!res.ok) throw new Error(`Delete failed (${res.status})`);
                                  await reloadAdmin();
                                  emitAdminUpdate({ productId: adminEditProductId });
                                } catch (e) {
                                  setEditError(e instanceof Error ? e.message : "Delete failed");
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        {r.title ? <p className="mt-2 text-sm font-medium">{r.title}</p> : null}
                        <p className="mt-2 text-sm text-[var(--text-muted)]">{r.body}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">No pending reviews.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-4">
                <p className="font-medium">Approved ({approvedReviews.length})</p>
                <div className="mt-3 space-y-3">
                  {approvedReviews.length ? (
                    approvedReviews.map((r) => (
                      <div key={r.id} className="rounded-[var(--radius)] border border-[var(--border)] bg-surface p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium">{r.userName ?? "User"}</p>
                          <p className="text-xs text-[var(--text-muted)]">{formatDate(r.createdAt)}</p>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <RatingStars value={r.rating} />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={async () => {
                                setEditError(null);
                                try {
                                  const res = await fetch(`/api/admin/reviews/${encodeURIComponent(r.id)}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ isApproved: false }),
                                  });
                                  if (!res.ok) throw new Error(`Unapprove failed (${res.status})`);
                                  await reloadAdmin();
                                  emitAdminUpdate({ productId: adminEditProductId });
                                } catch (e) {
                                  setEditError(e instanceof Error ? e.message : "Unapprove failed");
                                }
                              }}
                            >
                              Unapprove
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              onClick={async () => {
                                setEditError(null);
                                try {
                                  const res = await fetch(`/api/admin/reviews/${encodeURIComponent(r.id)}`, { method: "DELETE" });
                                  if (!res.ok) throw new Error(`Delete failed (${res.status})`);
                                  await reloadAdmin();
                                  emitAdminUpdate({ productId: adminEditProductId });
                                } catch (e) {
                                  setEditError(e instanceof Error ? e.message : "Delete failed");
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        {r.title ? <p className="mt-2 text-sm font-medium">{r.title}</p> : null}
                        <p className="mt-2 text-sm text-[var(--text-muted)]">{r.body}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">No approved reviews.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold">Related catalog items</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.slice(0, 4).map((r) => (
              <ProductCard
                key={r.id}
                id={r.id}
                slug={r.slug}
                name={r.name}
                purity={r.purity}
                image={getShopGridProductImage(r.slug, r.images)}
                price={r.price}
                compareAt={r.compareAt}
                variantId={r.variant_id}
                size={r.size}
                heroBackgroundCss={getProductShopGridBackgroundCss(r.slug)}
                imageObjectPosition={getShopGridImageObjectPosition(r.slug)}
              />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold">Reviews</h2>
          <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-3">
                <RatingStars value={Math.max(1, Math.round(averageRating ?? 5))} />
                <p className="text-sm text-[var(--text-muted)]">
                  {averageRating ? `${averageRating.toFixed(1)} average from ${reviews.length} review${reviews.length === 1 ? "" : "s"}` : "Be the first verified reviewer"}
                </p>
              </div>
              <p className="rounded-full border border-accent/40 bg-accent-muted px-3 py-1 text-xs text-accent">
                Help other researchers with your experience
              </p>
            </div>
            {reviews.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No reviews yet.</p> : null}
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <RatingStars value={r.rating} />
                    <p className="text-xs text-[var(--text-muted)]">{r.userName ?? "Researcher"}</p>
                  </div>
                  {r.title ? <p className="mt-2 font-medium">{r.title}</p> : null}
                  <p className="mt-2 text-sm text-[var(--text-muted)]">{r.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-5">
            <h3 className="font-display text-lg font-semibold">Submit a review</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Share your lab experience and help others evaluate this product. Verified purchase is required for approval.
            </p>
            <ReviewForm productId={product.id} />
          </div>
          <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-5">
            <h3 className="font-display text-lg font-semibold">Request Certificate of Analysis (COA)</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Need documentation for this product? Submit your name and email and we will send COA details.
            </p>
            <CoaRequestForm productSlug={product.slug} productName={product.name} />
          </div>
        </section>
      </div>
    </div>
  );
}

function ReviewForm({ productId }: { productId: string }) {
  const [ratingInput, setRatingInput] = useState("5");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(ratingInput);
    const rating = Number.isFinite(parsed) ? Math.min(5, Math.max(1, parsed)) : 5;
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, body }),
    });
    if (res.ok) setMsg("Review submitted — pending moderation.");
    else setMsg("Could not submit (verified purchase required).");
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3 rounded-[var(--radius)] border border-[var(--border)] p-4">
      <p className="text-sm font-medium">Submit a review</p>
      <div>
        <label className="text-sm font-medium">Rating (1–5)</label>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={5}
          value={ratingInput}
          onChange={(e) => setRatingInput(e.target.value)}
          onBlur={() => {
            const parsed = Number(ratingInput);
            if (!Number.isFinite(parsed)) {
              setRatingInput("5");
              return;
            }
            setRatingInput(String(Math.min(5, Math.max(1, parsed))));
          }}
          className="mt-1 flex h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 px-3 text-sm outline-none transition focus:border-accent/50 focus:outline-none focus:ring-0 focus-visible:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          className="mt-1 min-h-[100px] w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-3 text-sm outline-none transition focus:border-accent/50 focus:outline-none focus:ring-0 focus-visible:ring-0"
        />
      </div>
      <Button type="submit">Submit</Button>
      {msg ? <p className="text-sm text-[var(--text-muted)]">{msg}</p> : null}
    </form>
  );
}

