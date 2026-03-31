"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ResearchCard(props: {
  slug: string;
  name: string;
  image: string;
  purity?: number | null;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40">
      <Link href={`/research/product/${props.slug}`} className="relative aspect-[3/4] bg-[#05070b]">
        <Image
          src={props.image || "/placeholder-peptide.svg"}
          alt={props.name}
          fill
          className="object-cover object-center transition duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 25vw, 20vw"
          quality={100}
          unoptimized
        />
        {props.purity != null ? (
          <div className="absolute left-2 top-2">
            <Badge variant="purity">{props.purity}% purity</Badge>
          </div>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link
          href={`/research/product/${props.slug}`}
          className="font-display min-h-[3.5rem] text-lg font-semibold tracking-tight hover:text-accent"
        >
          {props.name}
        </Link>
        <div className="mt-auto pt-3">
          <Button className="w-full" asChild>
            <Link href={`/research/product/${props.slug}`}>View</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

