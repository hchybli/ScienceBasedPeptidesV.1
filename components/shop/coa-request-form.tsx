"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CoaRequestForm({ productSlug, productName }: { productSlug: string; productName: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      type: "coa_request" as const,
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      message: `Requesting COA for ${productName}.`,
      productSlug,
      productName,
    };
    setSending(true);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSending(false);
    if (res.ok) {
      setSent(true);
      setMsg("COA request submitted. Our team will follow up shortly.");
      form.reset();
    } else {
      setMsg("Could not submit COA request. Please try again.");
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-4">
      <div>
        <label className="text-sm font-medium">Full Name</label>
        <input
          name="name"
          required
          className="mt-1 flex h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface px-3 text-sm outline-none transition focus:border-accent/60"
          placeholder="Your full name"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Email Address</label>
        <input
          name="email"
          type="email"
          required
          className="mt-1 flex h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface px-3 text-sm outline-none transition focus:border-accent/60"
          placeholder="you@example.com"
        />
      </div>
      <Button type="submit" className="w-full sm:w-auto" disabled={sending}>
        {sending ? "Submitting..." : sent ? "Request Sent" : "Request COA"}
      </Button>
      {msg ? <p className="text-sm text-[var(--text-muted)]">{msg}</p> : null}
    </form>
  );
}

