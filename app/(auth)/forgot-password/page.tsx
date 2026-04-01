"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setMsg("If an account exists, a reset link has been sent.");
  }

  return (
    <div className="relative overflow-hidden bg-[var(--bg)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(169,212,236,0.2),transparent_42%),radial-gradient(circle_at_82%_24%,rgba(207,231,245,0.22),transparent_40%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:items-stretch md:py-24">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-6 shadow-[0_16px_48px_rgba(30,26,23,0.12)] md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Account access</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-[var(--text)]">Forgot password</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Enter the email used on your account. If the address exists, we will send a secure reset link that expires in about 1 hour.
            Open that email, click the reset link, and create a new password on the reset page.
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button className="w-full" type="submit">
              Send reset link
            </Button>
          </form>
          {msg ? <p className="mt-4 text-sm text-[var(--text-muted)]">{msg}</p> : null}
          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            <Link href="/login" className="text-accent transition hover:text-[var(--accent-hover)]">
              Log in
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
