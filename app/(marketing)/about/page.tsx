import type { Metadata } from "next";
import { Disclaimer } from "@/components/ui/disclaimer";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-semibold">About us</h1>
      <p className="mt-6 text-[var(--text-muted)] leading-relaxed">
        We focus on traceability: independent COAs, batch-level documentation, and conservative handling standards for
        research-grade peptides. Our operations are built for laboratories and qualified researchers who require clear
        chain-of-custody style documentation for their internal compliance workflows.
      </p>
      <p className="mt-4 text-[var(--text-muted)] leading-relaxed">
        Nothing on this site constitutes medical or regulatory advice.
      </p>
      <Disclaimer className="mt-8" />
    </div>
  );
}
