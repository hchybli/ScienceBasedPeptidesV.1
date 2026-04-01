"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export function NewsletterStrip() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isContactPage = pathname === "/contact";
  const hideOnLegal = pathname === "/terms" || pathname === "/privacy";
  const hideOnAuth =
    pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password";
  const hideOnCheckout = pathname === "/checkout";
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSending(true);
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, consent: true }),
    });
    setSending(false);
    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as { newlySubscribed?: boolean };
      setMsg(data.newlySubscribed ? "You have been signed up for updates." : "You are already subscribed to updates.");
      setEmail("");
    } else {
      setMsg("Please enter a valid email address.");
    }
  }

  if (hideOnLegal || hideOnAuth || hideOnCheckout) return null;

  return (
    <section
      className={
        isContactPage
          ? "relative z-10 bg-surface px-4 py-10 md:py-12"
          : isHomePage
            ? "relative z-20 -mt-10 -mb-10 px-4 md:-mt-12"
            : "relative z-20 mt-4 -mb-10 px-4 md:mt-6"
      }
    >
      <div className="mx-auto max-w-7xl rounded-2xl border border-[var(--border)] bg-[linear-gradient(110deg,#fffdf9,#f3efe7,#fffdf9)] p-6 shadow-[0_20px_50px_rgba(30,26,23,0.1)] md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h3 className="font-display text-2xl font-semibold tracking-tight text-[var(--text)]">Stay Updated with Science Based Peptides</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Get product release alerts, lab-focused insights, and catalog update notifications.
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">Be a part of 100+ subscribers, unsubscribe anytime.</p>
          </div>
          <form onSubmit={onSubmit} className="w-full max-w-md">
            <div className="flex w-full items-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1 shadow-inner">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="Enter your email"
                className="h-10 flex-1 bg-transparent px-4 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
              />
              <button
                type="submit"
                disabled={sending}
                className="h-10 rounded-full bg-accent px-5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
              >
                {sending ? "..." : "Subscribe"}
              </button>
            </div>
            {msg ? <p className="mt-2 text-xs text-[var(--text-muted)]">{msg}</p> : null}
          </form>
        </div>
      </div>
    </section>
  );
}

