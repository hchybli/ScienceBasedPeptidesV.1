"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

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
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-semibold">Log in</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {err ? <p className="text-sm text-danger">{err}</p> : null}
        <Button className="w-full" type="submit">
          Log in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        <Link href="/forgot-password" className="text-accent underline">
          Forgot password
        </Link>{" "}
        ·{" "}
        <Link href="/register" className="text-accent underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
