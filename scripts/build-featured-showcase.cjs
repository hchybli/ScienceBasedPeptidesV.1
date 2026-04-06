/* eslint-disable no-console */
/**
 * Rebuilds `public/products/showcase/<basename>` for homepage featured carousel:
 * copies current HALVECO shop PNG from `public/products/`, then removes the
 * card background (cream gradient from `images:match-backgrounds`) so vials are
 * transparent on the featured block.
 *
 * Run: node scripts/build-featured-showcase.cjs
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = process.cwd();
const PRODUCTS = path.join(ROOT, "public", "products");
const SHOWCASE = path.join(PRODUCTS, "showcase");

/** Basenames matching PRODUCT_CANONICAL_IMAGE for FEATURED_CAROUSEL_SLUGS (see app/(marketing)/page.tsx). */
const FEATURED_BASENAMES = [
  "bpc-157-clean-2.png",
  "bpc-157-tb-500-blend-clean-2.png",
  "bpc-157-ghk-cu-tb-blend-clean-2.png",
  "cjc-1295-ipamorelin-blend-clean-2.png",
  "igf-1-clean-2.png",
  "calgrilinitide-clean-2.png",
  "amino-1mq-clean-2.png",
  "snap-8-clean-2.png",
  "tb-500-clean-2.png",
  "tesamorelin-clean-2.png",
  "glutathione-clean-2.png",
];

function run() {
  if (!fs.existsSync(SHOWCASE)) fs.mkdirSync(SHOWCASE, { recursive: true });

  const creamScript = path.join(ROOT, "scripts", "showcase-knockout-cream.cjs");

  for (const name of FEATURED_BASENAMES) {
    const src = path.join(PRODUCTS, name);
    const dest = path.join(SHOWCASE, name);
    if (!fs.existsSync(src)) {
      console.warn(`skip (missing shop asset): ${name}`);
      continue;
    }
    fs.copyFileSync(src, dest);
    execSync(`node "${creamScript}" "${path.join("public", "products", "showcase", name)}"`, {
      stdio: "inherit",
      cwd: ROOT,
    });
  }
  console.log("Done: featured showcase PNGs rebuilt with transparent backgrounds.");
}

run();
