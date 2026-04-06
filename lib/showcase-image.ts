/** Product images in `public/products/` are used everywhere as-is (transparent PNG). */

export function resolveShowcaseImageUrl(productImagePath: string): string {
  return productImagePath;
}

/**
 * Featured Selection: always use the same canonical URL as shop (`/products/*-clean-2.png`).
 * Do not load `public/products/showcase/` — automated knockouts were damaging vial pixels
 * and `object-cover` on those crops made vials look deformed.
 */
export function resolveFeaturedShowcaseImageUrl(canonicalProductImageUrl: string): string {
  return canonicalProductImageUrl;
}
