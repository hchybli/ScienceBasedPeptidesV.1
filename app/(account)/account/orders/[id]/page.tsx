"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, parseJsonArray } from "@/lib/utils";

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/orders/${id}`, { credentials: "include" });
        if (res.ok) {
          const d = await res.json();
          setOrder(d.order);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-12 text-center text-[var(--text-muted)]">Loading order details...</div>;
  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-[var(--border)] bg-surface p-6 text-center">
          <p className="font-semibold">Order not found.</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">This order may no longer be available.</p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/account/orders">Back to Orders</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const rawItems = order.items;
  const items = Array.isArray(rawItems)
    ? (rawItems as Array<Record<string, unknown>>)
    : parseJsonArray<Record<string, unknown>>(rawItems as string, []);
  const shipping = (order.shippingAddress as Record<string, unknown> | undefined) ?? {};
  const status = String(order.status ?? "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="rounded-2xl border border-[var(--border)] bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Order {id.slice(0, 8).toUpperCase()}</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{formatDate(Number(order.created_at))}</p>
          </div>
          <div className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm text-accent">{status}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-[var(--border)] bg-surface p-6">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Purchased Items</h2>
          {items.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">No line items available for this order.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {items.map((i, idx) => {
                const quantity = Number(i.quantity) || 0;
                const lineTotal = Number(i.price) * quantity;
                return (
                  <div key={idx} className="rounded-xl border border-[var(--border)] bg-surface-2/70 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{String(i.name)}</p>
                      <p className="font-mono text-sm">{formatCurrency(lineTotal)}</p>
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {String(i.size)} x {quantity}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-[var(--border)] bg-surface p-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <p className="text-[var(--text-muted)]">Order Number</p>
                <p className="font-mono">{id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[var(--text-muted)]">Payment Status</p>
                <p>{status}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[var(--text-muted)]">Discount Code</p>
                <p>{(order.discount_code as string | null) || "—"}</p>
              </div>
              <div className="mt-3 border-t border-[var(--border)] pt-3 flex items-center justify-between">
                <p className="text-[var(--text-muted)]">Total</p>
                <p className="font-mono text-base">{formatCurrency(Number(order.total))}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-surface p-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Shipping</h2>
            <div className="mt-4 space-y-1 text-sm text-[var(--text-muted)]">
              {shipping && Object.keys(shipping).length > 0 ? (
                <>
                  <p>{String(shipping.fullName ?? shipping.name ?? "")}</p>
                  <p>{String(shipping.line1 ?? shipping.address1 ?? "")}</p>
                  {shipping.line2 ? <p>{String(shipping.line2)}</p> : null}
                  <p>
                    {String(shipping.city ?? "")}
                    {shipping.state ? `, ${String(shipping.state)}` : ""} {String(shipping.zip ?? shipping.postalCode ?? "")}
                  </p>
                  {shipping.country ? <p>{String(shipping.country)}</p> : null}
                </>
              ) : (
                <p>Shipping information unavailable.</p>
              )}
            </div>
            {order.tracking_number ? (
              <p className="mt-4 text-sm">
                Tracking: <span className="text-[var(--text)]">{String(order.tracking_carrier ?? "")}</span>{" "}
                <span className="font-mono text-[var(--text)]">{String(order.tracking_number)}</span>
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="mt-6">
        <Button variant="secondary" asChild>
          <Link href="/account/orders">Back to Orders</Link>
        </Button>
      </div>
    </div>
  );
}
