import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function parseJsonArray<T>(raw: string | null | undefined, fallback: T[]): T[] {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as T[]) : fallback;
  } catch {
    return fallback;
  }
}

const PLACEHOLDER_PRODUCT_IMAGE = "/placeholder-peptide.svg";

/** Higher = better primary (matches shop: processed *-clean-2* assets first). */
function productImageRank(url: string): number {
  const lower = url.toLowerCase();
  const ext = /\.(png|webp|jpe?g)$/i;
  const m2 = lower.match(/-clean-2\.(png|webp|jpe?g)$/);
  if (m2) return 1_000_000;
  const mN = lower.match(/-clean-(\d+)\.(png|webp|jpe?g)$/);
  if (mN) {
    const n = parseInt(mN[1], 10);
    return 500_000 + (200 - Math.min(n, 199));
  }
  if (/-clean\.(png|webp|jpe?g)$/i.test(lower)) return 400_000;
  if (/-clean-/i.test(lower) && ext.test(lower)) return 300_000;
  return 0;
}

/**
 * Reorders `products.images` so the first entry is always the same asset the shop grid uses
 * (prefer `*-clean-2.png`, then other `*-clean-*`, then legacy files).
 */
export function orderedProductImages(images: string[] | null | undefined): string[] {
  const list = images?.filter(Boolean) ?? [];
  if (list.length <= 1) return list;
  return list
    .map((url, index) => ({ url, index, rank: productImageRank(url) }))
    .sort((a, b) => b.rank - a.rank || a.index - b.index)
    .map((x) => x.url);
}

/**
 * Primary image URL for cards, PDP, cart — same as shop when multiple files exist.
 */
export function primaryProductImage(images: string[] | null | undefined): string {
  const ordered = orderedProductImages(images);
  return ordered[0] ?? PLACEHOLDER_PRODUCT_IMAGE;
}

/**
 * Curated “most popular” order (shop + research default sort). Slugs listed first; everything else
 * follows by `sold_count` desc, then name A–Z.
 */
export const MOST_POPULAR_CATALOG_SLUG_ORDER: string[] = [
  "retatrutide",
  "bpc-157",
  "semaglutide",
  "melanotan-ii",
  "nad-plus",
  "ghk-cu",
  "melanotan-i",
  "glow",
  "klow",
  "tesamorelin",
  "tb-500",
  "bacteriostatic-water-30ml",
  "bpc-157-tb-500-blend",
  "bpc-157-ghk-cu-tb-blend",
  "cjc-1295-ipamorelin-blend",
];

export function mostPopularCatalogOrder<T extends { slug?: unknown; sold_count?: unknown; name?: unknown }>(
  items: T[],
): T[] {
  const priority = new Map(MOST_POPULAR_CATALOG_SLUG_ORDER.map((s, i) => [s, i]));
  const tail = 1_000_000;
  return [...items].sort((a, b) => {
    const sa = String(a.slug ?? "");
    const sb = String(b.slug ?? "");
    const pa = priority.has(sa) ? (priority.get(sa) as number) : tail;
    const pb = priority.has(sb) ? (priority.get(sb) as number) : tail;
    if (pa !== pb) return pa - pb;
    const soldA = Number(a.sold_count ?? 0);
    const soldB = Number(b.sold_count ?? 0);
    if (soldA !== soldB) return soldB - soldA;
    return String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, { sensitivity: "base" });
  });
}
