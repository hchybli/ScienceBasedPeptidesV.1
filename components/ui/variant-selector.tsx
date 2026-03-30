"use client";

import { cn } from "@/lib/utils";

export interface VariantOption {
  id: string;
  size: string;
  price: number;
  compareAt?: number | null;
  inStock: boolean;
}

export function VariantSelector({
  variants,
  selectedId,
  onSelect,
}: {
  variants: VariantOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {variants.map((v) => (
        <button
          key={v.id}
          type="button"
          disabled={!v.inStock}
          onClick={() => onSelect(v.id)}
          className={cn(
            "rounded-[var(--radius)] border px-3 py-2 text-sm transition-colors",
            selectedId === v.id
              ? "border-accent bg-accent-muted text-accent"
              : "border-[var(--border)] bg-surface-2 text-[var(--text)] hover:border-accent/50",
            !v.inStock && "cursor-not-allowed opacity-40"
          )}
        >
          <span className="font-mono">{v.size}</span>
          <span className="ml-2 text-[var(--text-muted)]">${v.price.toFixed(2)}</span>
        </button>
      ))}
    </div>
  );
}
