"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);

  async function reload() {
    const res = await fetch(`/api/orders/${id}`);
    if (res.ok) setOrder((await res.json()).order);
  }

  useEffect(() => {
    void reload();
  }, [id]);

  async function confirm() {
    await fetch(`/api/orders/${id}/confirm`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed" }),
    });
    await reload();
  }

  async function ship(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch(`/api/orders/${id}/confirm`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingNumber: String(fd.get("tn") ?? ""),
        trackingCarrier: String(fd.get("tc") ?? ""),
        trackingUrl: String(fd.get("tu") ?? "") || undefined,
      }),
    });
    await reload();
  }

  if (!order) return <div className="p-12">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-2xl font-semibold">Order {id.slice(0, 8)}</h1>
      <p className="mt-2 text-sm">Status: {String(order.status)}</p>
      <p className="mt-4 font-mono text-sm break-all">Wallet: {String(order.crypto_wallet_sent_to)}</p>
      <p className="font-mono text-sm">
        Expected: {String(order.crypto_amount)} {String(order.crypto_currency)}
      </p>
      <p className="mt-2 font-mono text-sm break-all">Tx: {String(order.crypto_tx_hash ?? "—")}</p>
      <Button className="mt-6" type="button" onClick={confirm}>
        Mark as confirmed
      </Button>
      <form onSubmit={ship} className="mt-10 space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-4">
        <Input name="tn" label="Tracking number" required />
        <Input name="tc" label="Carrier" required />
        <Input name="tu" label="Tracking URL" />
        <Button type="submit">Save tracking & mark shipped</Button>
      </form>
      <p className="mt-8 font-mono text-lg">Total {formatCurrency(order.total as number)}</p>
    </div>
  );
}
