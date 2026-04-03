import fs from "fs";
import path from "path";

/** Homepage featured section: optional hand-placed transparent PNG in `public/products/showcase/<same basename>`. Not auto-generated. */
export function resolveShowcaseImageUrl(productImagePath: string): string {
  if (!productImagePath.startsWith("/products/")) return productImagePath;
  const basename = path.basename(productImagePath);
  const full = path.join(process.cwd(), "public", "products", "showcase", basename);
  if (fs.existsSync(full)) {
    return `/products/showcase/${basename}`;
  }
  return productImagePath;
}

/**
 * Featured Products block only (see `app/(marketing)/page.tsx` carousel).
 * Prefers hand showcase PNGs, then auto-generated vial-only PNGs in `showcase-auto/`, else shop asset.
 * Shop / PDP / referrals unchanged — they use {@link resolveShowcaseImageUrl} or canonical paths only.
 */
export function resolveFeaturedShowcaseImageUrl(productImagePath: string): string {
  if (!productImagePath.startsWith("/products/")) return productImagePath;
  const basename = path.basename(productImagePath);
  const hand = path.join(process.cwd(), "public", "products", "showcase", basename);
  if (fs.existsSync(hand)) {
    return `/products/showcase/${basename}`;
  }
  const autoPath = path.join(process.cwd(), "public", "products", "showcase-auto", basename);
  if (fs.existsSync(autoPath)) {
    return `/products/showcase-auto/${basename}`;
  }
  return productImagePath;
}
