"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace("/account");
    }
  }, [user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setErr("Invalid credentials");
      return;
    }
    const data = await res.json();
    setUser(data.user);
    router.push(sp.get("redirect") || "/account");
  }

  return (
    <div className="relative overflow-hidden bg-[var(--bg)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(169,212,236,0.2),transparent_42%),radial-gradient(circle_at_82%_24%,rgba(207,231,245,0.22),transparent_40%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:items-stretch md:py-24">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-6 shadow-[0_16px_48px_rgba(30,26,23,0.12)] md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Account access</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-[var(--text)]">Log in</h1>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Access your account dashboard, order history, and your unique affiliate referral link.
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {err ? <p className="text-sm text-danger">{err}</p> : null}
            <Button className="w-full" type="submit">
              Log in
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            <Link href="/forgot-password" className="text-accent transition hover:text-[var(--accent-hover)]">
              Forgot password
            </Link>{" "}
            ·{" "}
            <Link href="/register" className="text-accent transition hover:text-[var(--accent-hover)]">
              Create account
            </Link>
          </p>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_48px_rgba(30,26,23,0.1)] md:p-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--text)] md:text-3xl">Why create an account</h2>
          <div className="mt-6 space-y-4">
            {[
              "Your affiliate code is created once and remains permanently tied to your account.",
              "Each code is unique per user and cannot be duplicated for another account.",
              "Track referral activity and manage your affiliate link from your account dashboard.",
              "Get quick access to order history and account tools in one secure place.",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-relaxed text-[var(--text-muted)]">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
