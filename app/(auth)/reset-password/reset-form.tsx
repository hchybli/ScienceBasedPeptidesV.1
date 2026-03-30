"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ResetForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    if (!res.ok) {
      setErr("Could not reset");
      return;
    }
    router.push("/login");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-semibold">Reset password</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {err ? <p className="text-sm text-danger">{err}</p> : null}
        <Button className="w-full" type="submit">
          Update password
        </Button>
      </form>
    </div>
  );
}
