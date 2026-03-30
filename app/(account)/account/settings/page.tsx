"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Settings</h1>
      <div className="mt-8 space-y-4">
        <Input label="Email" value={user?.email ?? ""} readOnly />
        <p className="text-sm text-[var(--text-muted)]">Profile updates can be added to your account API.</p>
        <Button variant="danger" type="button" onClick={logout}>
          Log out
        </Button>
      </div>
    </div>
  );
}
