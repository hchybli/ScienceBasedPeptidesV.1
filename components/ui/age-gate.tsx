"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "site_access_verified_v1";

export function AgeGate() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [policyConfirmed, setPolicyConfirmed] = useState(false);
  const isLegalPage = pathname === "/terms" || pathname === "/privacy";

  useEffect(() => {
    if (isLegalPage) {
      setOpen(false);
      return;
    }
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v !== "true") setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [isLegalPage]);

  const confirm = () => {
    if (!ageConfirmed || !policyConfirmed) return;
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <Modal open={open} onOpenChange={() => {}} title="Research materials catalog" className="max-w-md" hideClose>
      <p className="text-sm text-[var(--text-muted)]">
        This catalog lists analytical and laboratory research compounds for qualified institutional use only. You must be
        18 or older to continue.
      </p>
      <div className="mt-4 space-y-3 rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-3">
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
          <span>I confirm I am 18 years of age or older.</span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={policyConfirmed}
            onChange={(e) => setPolicyConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-accent underline-offset-2 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-accent underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" type="button" onClick={() => (window.location.href = "https://www.google.com")}>
          Exit
        </Button>
        <Button type="button" onClick={confirm} disabled={!ageConfirmed || !policyConfirmed}>
          Continue
        </Button>
      </div>
    </Modal>
  );
}
