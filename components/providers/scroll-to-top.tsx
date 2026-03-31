"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    const smoothRoutes = pathname === "/terms" || pathname === "/privacy";
    window.scrollTo({ top: 0, left: 0, behavior: smoothRoutes ? "smooth" : "auto" });
  }, [pathname]);

  return null;
}

