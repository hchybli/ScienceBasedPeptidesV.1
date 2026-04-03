import { primaryProductImage } from "@/lib/utils";

/**
 * Single source of truth: which `/products/...` file is the vial hero for shop + PDP.
 * Every slug listed here must match a file in `public/products/`.
 */
export const PRODUCT_CANONICAL_IMAGE: Record<string, string> = {
  "5-amino-1mq": "/products/amino-1mq-clean-2.png",
  "aod-9604": "/products/aod-9604-clean-2.png",
  "bacteriostatic-water-30ml": "/products/bacteriostatic-water-30ml-clean-2.png",
  "bpc-157": "/products/bpc-157-clean-2.png",
  "bpc-157-ghk-cu-tb-blend": "/products/bpc-157-ghk-cu-tb-blend-clean-2.png",
  "bpc-157-tb-500-blend": "/products/bpc-157-tb-500-blend-clean-2.png",
  "cjc-1295-ipamorelin-blend": "/products/cjc-1295-ipamorelin-blend-clean-2.png",
  "cjc-1295-no-dac": "/products/cjc-1295-no-dac-clean-2.png",
  calgrilinitide: "/products/calgrilinitide-clean-2.png",
  glow: "/products/glow-clean-2.png",
  "ghk-cu": "/products/ghk-cu-clean-2.png",
  "igf-1": "/products/igf-1-clean-2.png",
  klow: "/products/klow-clean-2.png",
  kpv: "/products/kpv-clean-2.png",
  "melanotan-i": "/products/melanotan-i-clean-2.png",
  "melanotan-ii": "/products/melanotan-ii-clean-2.png",
  "mots-c": "/products/mots-c-clean-2.png",
  "nad-plus": "/products/nad-plus-clean-2.png",
  "pt-141": "/products/pt141-clean-2.png",
  retatrutide: "/products/retatrutide-clean-2.png",
  semaglutide: "/products/semaglutide-clean-2.png",
  "snap-8": "/products/snap-8-clean-2.png",
  "tb-500": "/products/tb-500-clean-2.png",
  tesamorelin: "/products/tesamorelin-clean-2.png",
  glutathione: "/products/glutathione-clean-2.png",
};

/**
 * Vertical gradients (lighter top → darker bottom) behind vials — must match shop cards and PDP.
 */
export const PRODUCT_PDP_GRADIENT: Record<string, string> = {
  "5-amino-1mq":
    "linear-gradient(180deg, #E85078 0%, #8B48A8 45%, #3088C8 100%)",
  "aod-9604":
    "linear-gradient(180deg, #FF7BA3 0%, #E84878 42%, #C02048 100%)",
  "bacteriostatic-water-30ml":
    "linear-gradient(180deg, #B8DDF5 0%, #5A8EB8 48%, #3D6A8A 100%)",
  "bpc-157": "linear-gradient(180deg, #6B9FE8 0%, #3D6AB8 45%, #1E3D6E 100%)",
  "bpc-157-ghk-cu-tb-blend":
    "linear-gradient(180deg, #4A6B5C 0%, #2D4A3E 48%, #1A2E28 100%)",
  "bpc-157-tb-500-blend":
    "linear-gradient(180deg, #B8E8D8 0%, #7AB89A 50%, #4A7A68 100%)",
  "cjc-1295-no-dac":
    "linear-gradient(180deg, #D4C8F0 0%, #A898D0 48%, #7A6A9E 100%)",
  dsip: "linear-gradient(180deg, #7EC8E8 0%, #4A98C8 48%, #2A6898 100%)",
  "cjc-1295-ipamorelin-blend":
    "linear-gradient(180deg, #8A6AB0 0%, #5A3A78 50%, #2E1A40 100%)",
  calgrilinitide:
    "linear-gradient(180deg, #F5E070 0%, #E88840 50%, #C84828 100%)",
  glow: "linear-gradient(180deg, #E8D078 0%, #C8A8D8 50%, #9888B8 100%)",
  "ghk-cu":
    "linear-gradient(180deg, #F5E8A8 0%, #E8D060 45%, #B89828 100%)",
  "igf-1": "linear-gradient(180deg, #FFB060 0%, #E87020 45%, #B84810 100%)",
  klow: "linear-gradient(180deg, #B8E8E0 0%, #88C8E8 50%, #5898C8 100%)",
  kpv: "linear-gradient(180deg, #F5D8C8 0%, #E8B090 50%, #C88868 100%)",
  "melanotan-i": "linear-gradient(180deg, #E8C8A8 0%, #C6A68A 50%, #8A7058 100%)",
  "melanotan-ii": "linear-gradient(180deg, #A08068 0%, #6B4A38 50%, #3D2818 100%)",
  "mots-c":
    "linear-gradient(180deg, #6BA0E8 0%, #88B8E8 40%, #E8D860 100%)",
  "nad-plus": "linear-gradient(180deg, #F0A898 0%, #C86858 48%, #8A4038 100%)",
  "pt-141": "linear-gradient(180deg, #E89048 0%, #D06028 50%, #984818 100%)",
  retatrutide: "linear-gradient(180deg, #E85060 0%, #B02038 50%, #681018 100%)",
  selank: "linear-gradient(180deg, #C8B8E8 0%, #9888C8 50%, #685898 100%)",
  semaglutide:
    "linear-gradient(180deg, #E89848 0%, #C04838 45%, #681828 100%)",
  "snap-8":
    "linear-gradient(180deg, #7B4A9E 0%, #C84850 48%, #E86838 100%)",
  "tb-500": "linear-gradient(180deg, #A8E8C8 0%, #68C898 50%, #2A7850 100%)",
  tesamorelin: "linear-gradient(180deg, #3D7A54 0%, #1E4D32 50%, #0E2818 100%)",
  glutathione: "linear-gradient(180deg, #7A5A4A 0%, #4A3020 50%, #2A1810 100%)",
};

const DEFAULT_PDP_GRADIENT =
  "linear-gradient(180deg, #3A3F48 0%, #252830 50%, #14161A 100%)";

/** Case-insensitive match so DB slugs still resolve (shop/research grid + PDP). */
const CANONICAL_IMAGE_BY_SLUG_LOWER = new Map(
  Object.entries(PRODUCT_CANONICAL_IMAGE).map(([k, v]) => [k.toLowerCase(), v]),
);

const PDP_GRADIENT_BY_SLUG_LOWER = new Map(
  Object.entries(PRODUCT_PDP_GRADIENT).map(([k, v]) => [k.toLowerCase(), v]),
);

function themeSlugKey(slug: string): string {
  return slug.trim().toLowerCase();
}

export function getCanonicalProductImage(slug: string, mergedImages: string[]): string {
  const path = CANONICAL_IMAGE_BY_SLUG_LOWER.get(themeSlugKey(slug));
  if (path) return path;
  return primaryProductImage(mergedImages);
}

export function getPdpHeroGradient(slug: string): string {
  return PDP_GRADIENT_BY_SLUG_LOWER.get(themeSlugKey(slug)) ?? DEFAULT_PDP_GRADIENT;
}
