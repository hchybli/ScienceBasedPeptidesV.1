import type { Metadata } from "next";
import { RESEARCH_USE_DISCLAIMER } from "@/lib/compliance";
import { DEFAULT_SITE_DISPLAY_NAME, DEFAULT_SITE_URL } from "@/lib/site";

/** Public brand name (see `lib/site.ts`). Not driven by env so stale `NEXT_PUBLIC_SITE_NAME` cannot override. */
const SITE = DEFAULT_SITE_DISPLAY_NAME;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;

export function siteMetadata(overrides: Partial<Metadata> = {}): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: SITE, template: `%s · ${SITE}` },
    description:
      "High-purity peptide and analytical reference materials for qualified laboratory research. Independent COAs and batch documentation. Research-use-only catalog — not for human consumption.",
    ...overrides,
  };
}

export function productJsonLd(params: {
  name: string;
  description: string;
  slug: string;
  price: number;
  currency?: string;
  availability?: "InStock" | "OutOfStock";
}) {
  const currency = params.currency ?? "USD";
  const desc = `${params.description} ${RESEARCH_USE_DISCLAIMER}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: params.name,
    description: desc,
    sku: params.slug,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${params.slug}`,
      priceCurrency: currency,
      price: params.price.toFixed(2),
      availability: `https://schema.org/${params.availability ?? "InStock"}`,
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE,
    url: SITE_URL,
  };
}
