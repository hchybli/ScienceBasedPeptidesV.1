"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "age_verified";

export function AgeGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v !== "true") setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const confirm = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <Modal open={open} onOpenChange={() => {}} title="Research materials catalog" className="max-w-md">
      <p className="text-sm text-[var(--text-muted)]">
        This catalog lists analytical and laboratory research compounds for qualified institutional use only. You must be
        18 or older to continue.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" type="button" onClick={() => (window.location.href = "https://www.google.com")}>
          Exit
        </Button>
        <Button type="button" onClick={confirm}>
          I am 18 or older
        </Button>
      </div>
    </Modal>
  );
}
