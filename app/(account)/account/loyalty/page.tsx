"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function LoyaltyPage() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/loyalty");
      if (res.ok) {
        const d = await res.json();
        setBalance(d.balance);
        setHistory(d.history ?? []);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Loyalty</h1>
      <p className="mt-4 font-mono text-3xl text-accent">{balance} pts</p>
      <form
        className="mt-8 flex flex-wrap items-end gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target as HTMLFormElement);
          const points = Number(fd.get("points"));
          const res = await fetch("/api/loyalty/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ points }),
          });
          if (res.ok) {
            const d = await res.json();
            setBalance(d.balance);
          }
        }}
      >
        <input name="points" type="number" min={500} step={100} placeholder="500+" className="h-10 rounded-md border border-[var(--border)] bg-surface-2 px-3" />
        <Button type="submit">Redeem</Button>
      </form>
      <div className="mt-10 space-y-2 text-sm">
        {history.map((h) => (
          <div key={String(h.id)} className="flex justify-between border-b border-[var(--border)] py-2">
            <span>{String(h.reason)}</span>
            <span className="font-mono">{String(h.points)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
