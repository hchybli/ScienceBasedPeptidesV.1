"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { VialSideDecorations } from "@/components/home/vial-side-decorations";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/lib/cart";
import { useCartStore } from "@/store/cart-store";

type VariantOption = {
  id: string;
  size: string;
  price: number;
  compareAt: number | null;
  isDefault: boolean;
};

type Item = {
  id: string;
  slug: string;
  name: string;
  purity: number | null;
  /** Canonical product art — same URLs as shop (no showcase/knockout). */
  image: string;
  /** Canonical shop/cart URL */
  shopImage: string;
  price: number;
  compareAt: number | null;
  variantId: string;
  size: string;
  variants: VariantOption[];
};

/** Default variant for price + add-to-cart (no size picker on featured block). */
function defaultVariant(item: Item | null) {
  if (!item?.variants?.length) return null;
  return item.variants.find((v) => v.isDefault) ?? item.variants[0] ?? null;
}

/** Compact label under non-selected thumbs; blends use short tokens (e.g. CJC + IPA). */
function featuredThumbShortLabel(name: string): string {
  const n = name.trim();
  const isBlend = /\s*\+\s*/.test(n);
  if (isBlend) {
    const parts = n.split(/\s*\+\s*/).map((p) => p.trim()).filter(Boolean);
    /** 3+ parts: tighter join (BPC+GHK+TB) so one line + aligned thumbs */
    const tight = parts.length >= 3;
    return parts.map((p) => abbrevPart(p.trim(), true, tight)).join(tight ? "+" : " + ");
  }
  if (n.length <= 14) return n;
  return abbrevPart(n, false);
}

function abbrevPart(segment: string, compactBlend: boolean, tightMultiBlend = false): string {
  const s = segment.trim();
  const low = s.toLowerCase();

  if (/^bpc[- ]?157$/i.test(s)) return compactBlend ? "BPC" : "BPC-157";
  if (/^tb[- ]?500$/i.test(s)) return compactBlend ? "TB" : "TB-500";
  if (/^ghk[- ]?cu$/i.test(s)) return tightMultiBlend ? "GHK" : "GHK-Cu";
  if (/^cjc[- ]?1295(?:\s+no\s+dac)?$/i.test(s)) return "CJC";
  if (/^ipamorelin$/i.test(s)) return "IPA";
  if (/^semaglutide$/i.test(s)) return "SEMA";
  if (/^retatrutide$/i.test(s)) return "RETA";
  if (/^tesamorelin$/i.test(s)) return "TES";
  if (/^melanotan\s*i$/i.test(s)) return "MT-I";
  if (/^melanotan\s*ii$/i.test(s)) return "MT-II";
  if (/^nad\+?$/i.test(s)) return "NAD+";
  if (/^bac(?:\s*water)?$/i.test(s) || /^bacteriostatic/i.test(low)) return "BAC water";

  if (s.length <= 14) return s;

  const words = s.split(/[\s/-]+/).filter(Boolean);
  if (words.length >= 2) {
    const acronym = words
      .map((w) => (/^\d/.test(w) ? w : w[0]))
      .join("")
      .toUpperCase()
      .slice(0, 6);
    return acronym || s.slice(0, 12);
  }
  return s.length > 14 ? `${s.slice(0, 12)}…` : s;
}

function FeaturedVialThumb(props: { item: Item }) {
  const { item } = props;
  return (
    // Plain img like hero stack: hand-exported PNGs with alpha; Next/Image can darken alpha edges.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.image}
      alt=""
      className="absolute inset-0 h-full w-full object-cover object-center [background:none] drop-shadow-[0_10px_22px_rgba(0,0,0,0.22)]"
      loading="lazy"
      decoding="async"
    />
  );
}

function FeaturedVialHero({ item }: { item: Item }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={item.id}
      src={item.image}
      alt=""
      className="absolute inset-0 h-full w-full object-cover object-center [background:none] drop-shadow-[0_24px_50px_rgba(0,0,0,0.35)]"
      loading="eager"
      decoding="async"
      fetchPriority="high"
    />
  );
}

export function FeaturedProductsShowcase({ items }: { items: Item[] }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const addItem = useCartStore((s) => s.addItem);

  const selected = useMemo(() => {
    return items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  }, [items, selectedId]);

  const activeVariant = useMemo(() => defaultVariant(selected), [selected]);

  if (!selected || !activeVariant) return null;

  function onAddToCart() {
    if (!selected || !activeVariant) return;
    const item: CartItem = {
      productId: selected.id,
      variantId: activeVariant.id,
      name: selected.name,
      slug: selected.slug,
      size: activeVariant.size,
      price: activeVariant.price,
      image: selected.shopImage,
      quantity: 1,
    };
    addItem(item);
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[#F5F2E9] p-10 shadow-[0_12px_40px_rgba(30,26,23,0.08)]">
      <VialSideDecorations imageUrls={items.map((i) => i.image)} />

      <div className="relative z-10">
        {/* Top row: text left, vial right — grouped and centered so side decor stays visible */}
        <div className="flex flex-col items-stretch gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-8 xl:gap-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex w-full min-w-0 shrink-0 flex-col justify-center text-left lg:max-w-[22rem]"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Featured selection</p>
              <h3 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">{selected.name}</h3>
              <p className="mt-1.5 text-sm text-[var(--text-muted)]">Research Compound</p>
              <div className="mt-3 flex items-end gap-2">
                <p className="font-mono text-2xl font-semibold">{formatCurrency(activeVariant.price)}</p>
                {activeVariant.compareAt && activeVariant.compareAt > activeVariant.price ? (
                  <p className="font-mono text-sm text-[var(--text-muted)] line-through">
                    {formatCurrency(activeVariant.compareAt)}
                  </p>
                ) : null}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button type="button" onClick={onAddToCart}>
                  Add to cart
                </Button>
                <Button variant="secondary" asChild>
                  <Link href={`/products/${selected.slug}`}>View product</Link>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="relative mx-auto w-full max-w-[min(100%,400px)] shrink-0 lg:mx-0">
            <div className="relative overflow-hidden rounded-3xl border border-[var(--border)]/50 bg-transparent shadow-[0_12px_40px_rgba(30,26,23,0.06)]">
              {/* Portrait frame; vials use object-cover to fill */}
              <div className="relative w-full aspect-[3/4]">
                <FeaturedVialHero item={selected} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-full justify-center">
            <div className="flex w-max max-w-none flex-nowrap items-start justify-center gap-4 md:gap-5">
              {items.map((item) => {
                const active = item.id === selected.id;
                const shortLabel = featuredThumbShortLabel(item.name);
                return (
                  <div
                    key={item.id}
                    className="flex w-[120px] shrink-0 flex-col items-center gap-2.5 md:w-[136px]"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`group relative flex w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-transparent transition aspect-[3/4] ${
                        active
                          ? "border-2 border-[var(--accent)] shadow-[0_0_0_1px_rgba(169,212,236,0.35)]"
                          : "border-[var(--border)] hover:border-[var(--border)]/80"
                      }`}
                      aria-label={`Select ${item.name}`}
                      aria-pressed={active}
                    >
                      <FeaturedVialThumb item={item} />
                    </button>
                    <div className="flex min-h-[2.25rem] w-full flex-col items-center justify-start">
                      <span className="block w-full text-center text-[10px] font-medium leading-snug tracking-wide text-[var(--text-muted)] [overflow-wrap:anywhere] line-clamp-2 md:text-[11px]">
                        {shortLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
