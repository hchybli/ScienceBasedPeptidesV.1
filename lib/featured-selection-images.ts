/**
 * Homepage Featured Selection only (shop grid unchanged).
 * Art lives in `public/product-media/featured-selection/`. Vials must match **HALVECO** label exports —
 * not legacy shop `*-clean-2.png` art. Rebuild from your `*_HALVECO-*` sources with
 * `scripts/fit-studio-vial-to-nad-canvas.cjs` (1024×559 PNG + alpha). Replace files in place when
 * updating art.
 */
export const FEATURED_SELECTION_IMAGE_BY_SLUG: Record<string, string> = {
  "bpc-157": "/products/featured-selection/bpc-157.png",
  "ghk-cu": "/products/featured-selection/ghk-cu.png",
  "melanotan-ii": "/products/featured-selection/melanotan-ii.png",
  "nad-plus": "/products/featured-selection/nad-plus.png",
  "bacteriostatic-water-30ml": "/products/featured-selection/bacteriostatic-water-30ml.png",
  retatrutide: "/products/featured-selection/retatrutide.png",
  "tb-500": "/products/featured-selection/tb-500.png",
};

/** Display order for the featured carousel (must match keys in `FEATURED_SELECTION_IMAGE_BY_SLUG`). */
export const FEATURED_CAROUSEL_SLUGS = [
  "bpc-157",
  "ghk-cu",
  "melanotan-ii",
  "nad-plus",
  "bacteriostatic-water-30ml",
  "retatrutide",
  "tb-500",
] as const;
