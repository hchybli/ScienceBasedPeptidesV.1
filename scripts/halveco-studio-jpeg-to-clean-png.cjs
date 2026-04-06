/* eslint-disable no-console */
/**
 * HALVECO studio shots (JPEG data, #000 background): export clean PNG alpha for shop cards.
 * Uses a **feathered** matte instead of a hard RGB cutoff — avoids jagged “lines” and blocky
 * JPEG edges that `convert-jpeg-mislabeled-to-png-alpha.cjs` can produce.
 *
 * Output: RGBA with transparent #000 studio; pair with `getProductHeroBackgroundCss` on the card
 * (same idea as amino-1mq). Do **not** blur the alpha channel afterward.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

function smoothstep(edge0, edge1, x) {
  if (edge1 === edge0) return x >= edge1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

async function main() {
  const input = process.argv[2];
  const output = process.argv[3];
  const tLow = Number(process.argv[4] ?? 6);
  const tHigh = Number(process.argv[5] ?? 52);
  if (!input || !output) {
    console.error(
      "Usage: node halveco-studio-jpeg-to-clean-png.cjs <input> <output> [tLow=6] [tHigh=52]",
    );
    process.exit(1);
  }
  if (!fs.existsSync(input)) {
    console.error("Missing input:", input);
    process.exit(1);
  }

  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const v = Math.max(r, g, b);
    let a;
    if (v <= tLow) {
      a = 0;
    } else if (v >= tHigh) {
      a = 255;
    } else {
      a = Math.round(255 * smoothstep(tLow, tHigh, v));
    }
    data[i + 3] = a;
  }

  // No alpha-channel blur: blurring alpha smeared semi-transparent pixels across the vial and
  // composited terribly with shop gradients / object-cover (and looked "glitched" vs other cards).
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(output);

  const meta = await sharp(output).metadata();
  console.log(
    "[halveco-studio-jpeg-to-clean-png] wrote",
    path.basename(output),
    meta.format,
    meta.width,
    "x",
    meta.height,
    "alpha",
    meta.hasAlpha,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
