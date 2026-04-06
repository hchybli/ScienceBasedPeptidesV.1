/* eslint-disable no-console */
/**
 * Writes transparent-background PNGs to `public/products/showcase-auto/` for the
 * homepage Featured Products block only. Source: `public/products/<basename>`.
 * Uses edge-connected flood fill (allows smooth gradients) so vial interiors stay opaque.
 *
 * Run: node scripts/generate-featured-showcase-auto.cjs
 * Requires: sharp, source PNGs in public/products/
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const PRODUCTS_DIR = path.join(process.cwd(), "public", "products");
const OUT_DIR = path.join(process.cwd(), "public", "products", "showcase-auto");

/** Basenames for FEATURED_CAROUSEL_SLUGS (must match canonical filenames in `lib/product-pdp-theme.ts`). */
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

/** Max RGB distance between 4-neighbors for BFS to continue across gradient panels (tight = stop at vial). */
const ADJACENT_MAX_DIST = 12;

function idx(x, y, w) {
  return y * w + x;
}

function dist2Rgb(data, ia, ib) {
  const dr = data[ia] - data[ib];
  const dg = data[ia + 1] - data[ib + 1];
  const db = data[ia + 2] - data[ib + 2];
  return dr * dr + dg * dg + db * db;
}

async function stripPanelToTransparent(inputPath, outputPath) {
  const input = sharp(inputPath);
  const { data, info } = await input.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const len = w * h;
  const bg = new Uint8Array(len);
  const queue = [];

  function tryPush(x, y) {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = idx(x, y, w);
    if (bg[i]) return;
    bg[i] = 1;
    queue.push([x, y]);
  }

  for (let x = 0; x < w; x += 1) {
    tryPush(x, 0);
    tryPush(x, h - 1);
  }
  for (let y = 0; y < h; y += 1) {
    tryPush(0, y);
    tryPush(w - 1, y);
  }

  const adj2 = ADJACENT_MAX_DIST * ADJACENT_MAX_DIST;

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    const i = idx(x, y, w);
    const ia = i * 4;
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = idx(nx, ny, w);
      if (bg[ni]) continue;
      const ib = ni * 4;
      if (dist2Rgb(data, ia, ib) <= adj2) {
        bg[ni] = 1;
        queue.push([nx, ny]);
      }
    }
  }

  let bgCount = 0;
  for (let i = 0; i < len; i += 1) {
    if (bg[i]) bgCount += 1;
  }
  const bgRatio = bgCount / len;
  if (bgRatio < 0.04 || bgRatio > 0.985) {
    console.warn(
      `  skip ${path.basename(inputPath)}: bgRatio ${bgRatio.toFixed(2)} (tune ADJACENT_MAX_DIST if needed)`,
    );
    return false;
  }

  const out = Buffer.from(data);
  for (let i = 0; i < len; i += 1) {
    if (bg[i]) {
      const o = i * 4;
      out[o + 3] = 0;
    }
  }

  const tmp = `${outputPath}.tmp`;
  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(tmp);
  fs.renameSync(tmp, outputPath);
  return true;
}

async function run() {
  if (!fs.existsSync(PRODUCTS_DIR)) {
    console.log("No public/products — skipping.");
    return;
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0;
  let missing = 0;
  for (const basename of FEATURED_BASENAMES) {
    const inputPath = path.join(PRODUCTS_DIR, basename);
    const outputPath = path.join(OUT_DIR, basename);
    if (!fs.existsSync(inputPath)) {
      console.warn(`  missing source: ${basename}`);
      missing += 1;
      continue;
    }
    try {
      const did = await stripPanelToTransparent(inputPath, outputPath);
      if (did) {
        console.log(`  wrote ${basename}`);
        ok += 1;
      }
    } catch (e) {
      console.warn(`  error ${basename}:`, String(e));
    }
  }
  console.log(`Featured showcase-auto: ${ok} written, ${missing} missing sources.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
