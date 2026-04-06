"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";

export default function ReferralsPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<Array<{ status: string; c: number }>>([]);
  const [copied, setCopied] = useState(false);

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

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Affiliate</h1>
      <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-4">
        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Your affiliate link</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-base font-semibold text-accent hover:underline">
          HALVECO
        </a>
        <div className="mt-3">
          <Button type="button" size="sm" variant="secondary" onClick={copyLink} disabled={!url}>
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      </div>
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
