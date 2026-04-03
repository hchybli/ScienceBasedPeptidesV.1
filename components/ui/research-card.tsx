"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ResearchCard(props: {
  slug: string;
  name: string;
  image: string;
  imageGradient?: string;
  purity?: number | null;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40">
      <Link
        href={`/research/product/${props.slug}`}
        className={cn("relative aspect-[3/4]", !props.imageGradient && "bg-[var(--surface-2)]")}
        style={props.imageGradient ? { background: props.imageGradient } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={props.image || "/placeholder-peptide.svg"}
          alt={props.name}
          className="absolute inset-0 h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          decoding="async"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link
          href={`/research/product/${props.slug}`}
          className="font-display min-h-[3.5rem] text-lg font-semibold tracking-tight hover:text-accent"
        >
          {props.name}
        </Link>
        {props.purity != null ? (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{props.purity}% purity</p>
        ) : null}
        <div className="mt-auto pt-3">
          <Button className="w-full" asChild>
            <Link href={`/research/product/${props.slug}`}>View</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

