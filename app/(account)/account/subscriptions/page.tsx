"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/subscriptions");
      if (res.ok) {
        const d = await res.json();
        setSubs(d.subscriptions ?? []);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Subscriptions</h1>
      <div className="mt-8 space-y-4">
        {subs.map((s) => (
          <div key={s.id as string} className="rounded-[var(--radius)] border border-[var(--border)] bg-surface p-4">
            <p className="font-mono text-sm">{String(s.id).slice(0, 8)}</p>
            <p className="text-sm text-[var(--text-muted)]">Status: {String(s.status)}</p>
            <Button
              className="mt-4"
              variant="danger"
              type="button"
              onClick={async () => {
                await fetch(`/api/subscriptions/${s.id}`, { method: "DELETE" });
                setSubs((prev) => prev.filter((x) => x.id !== s.id));
              }}
            >
              Cancel
            </Button>
          </div>
        ))}
        {subs.length === 0 ? <p className="text-[var(--text-muted)]">No active subscriptions.</p> : null}
      </div>
    </div>
  );
}
