"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";

export default function ReferralsPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<Array<{ status: string; c: number }>>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/referrals");
      if (res.ok) {
        const d = await res.json();
        setStats(d.stats ?? []);
      }
    })();
  }, []);

  const url = typeof window !== "undefined" ? `${window.location.origin}/ref/${user?.referralCode ?? ""}` : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Referrals</h1>
      <p className="mt-4 break-all font-mono text-sm text-accent">{url}</p>
      <div className="mt-8 space-y-2 text-sm">
        {stats.map((s) => (
          <div key={s.status} className="flex justify-between">
            <span>{s.status}</span>
            <span>{s.c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
