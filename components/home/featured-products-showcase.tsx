"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
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
  /** Showcase vial art (`resolveShowcaseImageUrl`); GHK-Cu matches shopImage */
  image: string;
  /** Canonical shop/cart URL */
  shopImage: string;
  price: number;
  compareAt: number | null;
  variantId: string;
  size: string;
  variants: VariantOption[];
};

const spring = {
  type: "spring",
  stiffness: 110,
  damping: 20,
} as const;

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

/** Same fill + crop in the holder for every vial (matches former GHK-Cu treatment). */
function FeaturedVialThumb(props: { item: Item; active: boolean }) {
  const { item, active } = props;
  const img = (
    <Image
      src={item.image}
      alt=""
      fill
      className="object-cover object-center"
      sizes="100px"
      quality={100}
      unoptimized
    />
  );
  if (active) {
    return <div className="relative h-full w-full opacity-95">{img}</div>;
  }
  return (
    <motion.div layoutId={`featured-vial-${item.id}`} transition={spring} className="relative h-full w-full">
      {img}
    </motion.div>
  );
}

function FeaturedVialHero({ item }: { item: Item }) {
  return (
    <motion.div
      key={`hero-${item.id}`}
      layoutId={`featured-vial-${item.id}`}
      transition={spring}
      className="relative h-full w-full"
    >
      <Image
        src={item.image}
        alt=""
        fill
        className="object-cover object-center"
        sizes="(max-width: 640px) 240px, 280px"
        quality={100}
        unoptimized
        priority
      />
    </motion.div>
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
    <LayoutGroup id="homepage-featured-showcase">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[linear-gradient(150deg,rgba(255,253,249,0.98),rgba(243,239,231,0.96))] p-5 md:p-7">
        <VialSideDecorations imageUrls={items.map((i) => i.image)} />

        <div className="relative z-10">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-center md:gap-6 lg:gap-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
              className="flex w-full max-w-[22rem] shrink-0 flex-col justify-center text-left md:max-w-[20rem]"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Featured selection</p>
              <h3 className="mt-1.5 font-display text-3xl font-semibold tracking-tight md:text-4xl">{selected.name}</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Research Compound</p>
              <div className="mt-2.5 flex items-end gap-2">
                <p className="font-mono text-2xl font-semibold">{formatCurrency(activeVariant.price)}</p>
                {activeVariant.compareAt && activeVariant.compareAt > activeVariant.price ? (
                  <p className="font-mono text-sm text-[var(--text-muted)] line-through">
                    {formatCurrency(activeVariant.compareAt)}
                  </p>
                ) : null}
              </div>
              <div className="mt-3.5 flex flex-wrap gap-3">
                <Button type="button" onClick={onAddToCart}>
                  Add to cart
                </Button>
                <Button variant="secondary" asChild>
                  <Link href={`/products/${selected.slug}`}>View product</Link>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="relative flex h-[300px] w-[240px] shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-2)] sm:h-[330px] sm:w-[260px] md:h-[360px] md:w-[280px]">
            <FeaturedVialHero key={selected.id} item={selected} />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* w-max + justify-start: stable horizontal scroll; avoid mx-auto/justify-center (centers wide row and breaks alignment vs viewport). */}
          <div className="flex w-max max-w-none flex-nowrap items-start justify-start gap-3 md:gap-4">
            {items.map((item) => {
              const active = item.id === selected.id;
              const shortLabel = featuredThumbShortLabel(item.name);
              return (
                <div
                  key={item.id}
                  className="flex w-[82px] shrink-0 flex-col items-center gap-1.5 md:w-[100px]"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`group relative flex h-[104px] w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border transition md:h-[128px] ${
                      active
                        ? "border-accent/50 bg-accent-muted/40"
                        : "border-[var(--border)] bg-[var(--surface-2)] opacity-80 hover:scale-[1.03] hover:opacity-100"
                    }`}
                    aria-label={`Select ${item.name}`}
                  >
                    <FeaturedVialThumb item={item} active={active} />
                  </button>
                  {/* Same width as vial column; truncate so label width never widens the flex track */}
                  <div className="flex min-h-[2.125rem] w-full flex-col items-center justify-start md:min-h-[2.375rem]">
                    <span
                      className={`block w-full break-words text-center text-[10px] font-medium leading-snug tracking-wide [overflow-wrap:anywhere] line-clamp-2 md:text-[11px] ${
                        active ? "invisible pointer-events-none select-none" : "text-[var(--text-muted)]"
                      }`}
                      aria-hidden={active}
                    >
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
    </LayoutGroup>
  );
}
