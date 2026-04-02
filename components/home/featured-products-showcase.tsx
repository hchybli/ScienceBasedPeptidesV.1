"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/lib/cart";
import { useCartStore } from "@/store/cart-store";

type Item = {
  id: string;
  slug: string;
  name: string;
  purity: number | null;
  image: string;
  price: number;
  compareAt: number | null;
  variantId: string;
  size: string;
};

const spring = {
  type: "spring",
  stiffness: 110,
  damping: 20,
} as const;

export function FeaturedProductsShowcase({ items }: { items: Item[] }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const addItem = useCartStore((s) => s.addItem);

  const selected = useMemo(() => {
    return items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  }, [items, selectedId]);

  if (!selected) return null;

  function onAddToCart() {
    const item: CartItem = {
      productId: selected.id,
      variantId: selected.variantId,
      name: selected.name,
      slug: selected.slug,
      size: selected.size,
      price: selected.price,
      image: selected.image,
      quantity: 1,
    };
    addItem(item);
  }

  return (
    <LayoutGroup id="homepage-featured-showcase">
      <div className="rounded-3xl border border-[var(--border)] bg-[linear-gradient(150deg,rgba(255,253,249,0.98),rgba(243,239,231,0.96))] p-5 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.26, ease: "easeOut" }}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Featured selection</p>
                <h3 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">{selected.name}</h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Research Compound</p>
                <div className="mt-4 flex items-end gap-2">
                  <p className="font-mono text-2xl font-semibold">{formatCurrency(selected.price)}</p>
                  {selected.compareAt && selected.compareAt > selected.price ? (
                    <p className="font-mono text-sm text-[var(--text-muted)] line-through">{formatCurrency(selected.compareAt)}</p>
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
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative mx-auto flex h-[380px] w-full max-w-[540px] items-center justify-center overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-2)] md:h-[460px]">
              <div className="pointer-events-none absolute left-[12%] top-[52%] h-[62%] w-[42%] -translate-y-1/2 opacity-20 blur-[2px]">
                <div
                  className="h-full w-full bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${selected.image})` }}
                />
              </div>
              <div className="pointer-events-none absolute right-[12%] top-[48%] h-[56%] w-[38%] -translate-y-1/2 opacity-18 blur-[2.5px]">
                <div
                  className="h-full w-full bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${selected.image})` }}
                />
              </div>
              <motion.div
                key={`hero-${selected.id}`}
                layoutId={`featured-vial-${selected.id}`}
                transition={spring}
                className="relative h-[82%] w-[62%] max-w-[300px]"
              >
                <div
                  className="h-full w-full bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${selected.image})` }}
                  aria-label={selected.name}
                />
              </motion.div>
            </div>
          </div>
        </div>

        <div className="mt-7 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto flex min-w-max items-end justify-center gap-4 md:gap-5">
            {items.map((item) => {
              const active = item.id === selected.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`group relative flex h-[92px] w-[72px] items-center justify-center rounded-2xl border transition md:h-[108px] md:w-[84px] ${
                    active
                      ? "border-accent/50 bg-accent-muted/40"
                      : "border-[var(--border)] bg-[var(--surface-2)] opacity-80 hover:scale-[1.03] hover:opacity-100"
                  }`}
                  aria-label={`Select ${item.name}`}
                >
                  {active ? (
                    <div
                      className="h-[82%] w-[70%] bg-contain bg-center bg-no-repeat opacity-95"
                      style={{ backgroundImage: `url(${item.image})` }}
                    />
                  ) : (
                    <motion.div
                      layoutId={`featured-vial-${item.id}`}
                      transition={spring}
                      className="h-[82%] w-[70%]"
                    >
                      <div className="h-full w-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${item.image})` }} />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </LayoutGroup>
  );
}
