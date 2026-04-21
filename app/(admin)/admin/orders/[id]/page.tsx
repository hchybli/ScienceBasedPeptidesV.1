"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [notes, setNotes] = useState("");

  async function reload() {
    const res = await fetch(`/api/admin/orders/${id}`);
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
      setNotes(String(data.order?.admin_notes ?? ""));
    }
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

  async function saveNotes() {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_notes: notes || null }),
    });
    if (res.ok) await reload();
  }

  if (!order) return <div className="p-12">Loading…</div>;

  const status = String(order.status ?? "");
  const statusVariant =
    status === "confirmed" || status === "delivered"
      ? "success"
      : status === "shipped" || status === "processing"
        ? "warning"
        : status === "awaiting_confirmation"
          ? "neutral"
          : "neutral";

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">Order {id.slice(0, 8)}</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Placed: {formatDate(order.created_at as number)}</p>
        </div>
        <Badge variant={statusVariant as "success" | "warning" | "neutral"}>{status || "—"}</Badge>
      </div>

      <div className="mt-6 grid gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold">Payment (crypto)</h3>
            <p className="mt-3 font-mono text-sm break-all">Wallet: {String(order.crypto_wallet_sent_to)}</p>
            <p className="mt-1 font-mono text-sm">
              Expected: {String(order.crypto_amount)} {String(order.crypto_currency)}
            </p>
            <p className="mt-1 font-mono text-sm break-all">Tx: {String(order.crypto_tx_hash ?? "—")}</p>
            <div className="mt-4">
              <Button type="button" onClick={confirm}>
                Mark as confirmed
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold">Fulfillment</h3>
            <form onSubmit={ship} className="mt-4 grid gap-4 md:grid-cols-2">
              <Input name="tn" label="Tracking number" required />
              <Input name="tc" label="Carrier" required />
              <div className="md:col-span-2">
                <Input name="tu" label="Tracking URL" />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Save tracking & mark shipped</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold">Admin notes</h3>
            <textarea
              className="mt-4 min-h-[120px] w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-3 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes (not visible to customer)…"
            />
            <div className="mt-3">
              <Button type="button" variant="secondary" onClick={saveNotes}>
                Save notes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 font-mono text-lg">Total {formatCurrency(order.total as number)}</p>
    </div>
  );
}
