/* eslint-disable no-console */
/**
 * Some exports are JPEG data saved as `.png` (no alpha). Convert to a real PNG
 * by making near-black pixels transparent. Tuned for #000 studio backgrounds.
 *
 * For **HALVECO studio vial** shots on the shop, prefer `halveco-studio-jpeg-to-clean-png.cjs`
 * (feathered matte + soft alpha) — hard thresholds here can leave visible lines / block edges.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function main() {
  const input = process.argv[2];
  const output = process.argv[3];
  const threshold = Number(process.argv[4] || 28);
  if (!input || !output) {
    console.error("Usage: node convert-jpeg-mislabeled-to-png-alpha.cjs <input> <output> [threshold]");
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
    if (r <= threshold && g <= threshold && b <= threshold) {
      data[i + 3] = 0;
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(output);

  const meta = await sharp(output).metadata();
  console.log("[convert-jpeg-mislabeled-to-png-alpha] wrote", path.basename(output), meta.format, meta.width, "x", meta.height, "alpha", meta.hasAlpha);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
