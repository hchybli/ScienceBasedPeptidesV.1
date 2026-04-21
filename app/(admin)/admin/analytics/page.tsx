"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) setData(await res.json());
    })();
  }, []);
  return (
    <div className="max-w-5xl">
      <h2 className="font-display text-2xl font-semibold">Analytics</h2>
      <pre className="mt-8 overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-surface p-4 text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
      {data?.aov ? (
        <p className="mt-4 text-sm">
          AOV all time: {formatCurrency((data.aov as { allTime: number }).allTime)}
        </p>
      ) : null}
    </div>
  );
}
