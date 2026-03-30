"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatCurrency, formatDate, parseJsonArray } from "@/lib/utils";

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const d = await res.json();
        setOrder(d.order);
      }
    })();
  }, [id]);

  if (!order) return <div className="p-12 text-center">Loading…</div>;

  const rawItems = order.items;
  const items = Array.isArray(rawItems)
    ? (rawItems as Array<Record<string, unknown>>)
    : parseJsonArray<Record<string, unknown>>(rawItems as string, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Order {id.slice(0, 8)}</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{formatDate(order.created_at as number)}</p>
      <p className="mt-2 text-sm">Status: {String(order.status)}</p>
      <ul className="mt-8 space-y-2">
        {items.map((i, idx) => (
          <li key={idx} className="flex justify-between text-sm">
            <span>
              {String(i.name)} ({String(i.size)}) × {String(i.quantity)}
            </span>
            <span className="font-mono">{formatCurrency(Number(i.price) * Number(i.quantity))}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 font-mono text-lg">{formatCurrency(order.total as number)}</p>
      {order.tracking_number ? (
        <p className="mt-4 text-sm">
          Tracking: {String(order.tracking_carrier)} {String(order.tracking_number)}
        </p>
      ) : null}
    </div>
  );
}
