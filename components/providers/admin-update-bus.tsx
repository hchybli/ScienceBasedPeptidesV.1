"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const CHANNEL = "sbp_admin_updates_v1";

export function emitAdminUpdate(payload: { productId?: string; at?: number } = {}) {
  try {
    const msg = { type: "productUpdated", at: Date.now(), ...payload };
    if (typeof BroadcastChannel !== "undefined") {
      const ch = new BroadcastChannel(CHANNEL);
      ch.postMessage(msg);
      ch.close();
    }
    try {
      localStorage.setItem(CHANNEL, JSON.stringify(msg));
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
}

export function AdminUpdateBus() {
  const router = useRouter();

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    const onMsg = () => router.refresh();

    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel(CHANNEL);
      bc.onmessage = onMsg;
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key !== CHANNEL) return;
      router.refresh();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      if (bc) bc.close();
    };
  }, [router]);

  return null;
}

