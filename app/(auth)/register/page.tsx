"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, referralCode: referralCode || undefined }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Could not register");
      return;
    }
    const data = await res.json();
    setUser(data.user);
    router.push("/account");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-semibold">Create account</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Password (min 8)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Input label="Referral code (optional)" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
        {err ? <p className="text-sm text-danger">{err}</p> : null}
        <Button className="w-full" type="submit">
          Register
        </Button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-accent underline">
          Already have an account?
        </Link>
      </p>
    </div>
  );
}
