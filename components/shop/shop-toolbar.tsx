"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  initialQuery: string;
  initialSort: string;
};

export function ShopToolbar({ initialQuery, initialSort }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState(initialSort);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setSort(initialSort);
  }, [initialSort]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) params.set("q", query.trim());
      else params.delete("q");
      if (sort) params.set("sort", sort);
      else params.delete("sort");
      router.replace(`${pathname}?${params.toString()}`);
    }, 180);

    return () => clearTimeout(timeout);
  }, [pathname, query, router, searchParams, sort]);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex w-full max-w-xl items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="h-11 w-full rounded-full border border-[var(--border)] bg-surface px-4 text-sm outline-none transition focus:border-accent/50"
        />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="sort" className="text-sm text-[var(--text-muted)]">
          Sort by:
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-11 min-w-[170px] rounded-full border border-[var(--border)] bg-surface px-4 text-sm outline-none transition focus:border-accent/50"
        >
          <option value="most_popular">Most Popular</option>
          <option value="a_z">A - Z</option>
          <option value="z_a">Z - A</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
}
