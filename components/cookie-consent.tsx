"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const KEY = "cookie_consent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(KEY, "accepted");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-[var(--border)] bg-surface p-4 shadow-2xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-[var(--text-muted)]">
          We use essential cookies to run the cart and session. By continuing, you agree to our{" "}
          <a className="text-accent underline" href="/privacy">
            Privacy Policy
          </a>
          .
        </p>
        <Button type="button" onClick={accept}>
          Accept
        </Button>
      </div>
    </div>
  );
}
