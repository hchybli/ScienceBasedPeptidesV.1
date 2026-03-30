import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({ value, className }: { value: number; className?: string }) {
  const full = Math.round(value);
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("h-4 w-4", i < full ? "fill-warning text-warning" : "text-[var(--border)]")}
        />
      ))}
    </div>
  );
}
