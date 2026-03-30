import { cn } from "@/lib/utils";
import { RESEARCH_USE_DISCLAIMER } from "@/lib/compliance";

export function Disclaimer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100/90",
        className
      )}
    >
      <p className="font-semibold text-amber-200">Research use only</p>
      <p className="mt-2 leading-relaxed">{RESEARCH_USE_DISCLAIMER}</p>
    </div>
  );
}

export function FooterDisclaimer({ className }: { className?: string }) {
  return <p className={cn("text-xs text-[var(--text-muted)]", className)}>{RESEARCH_USE_DISCLAIMER}</p>;
}
