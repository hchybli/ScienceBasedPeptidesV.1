/* eslint-disable no-console */
/**
 * Featured carousel: NAD+ uses hand PNGs at 1024×559 with native alpha. JPEG / tall exports
 * get scaled with Lanczos3 into that same canvas (fit contain, centered), then only
 * near‑#000 pixels are made transparent so the vial is not eaten like aggressive global knockouts.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const W = 1024;
const H = 559;
const DEFAULT_THRESHOLD = 14;

async function main() {
  const input = process.argv[2];
  const output = process.argv[3];
  const threshold = Number(process.argv[4] ?? DEFAULT_THRESHOLD);
  if (!input || !output) {
    console.error("Usage: node fit-studio-vial-to-nad-canvas.cjs <input> <output> [threshold]");
    process.exit(1);
  }
  if (!fs.existsSync(input)) {
    console.error("Missing input:", input);
    process.exit(1);
  }

  const { data, info } = await sharp(input)
    .resize(W, H, {
      fit: "contain",
      position: "center",
      background: { r: 0, g: 0, b: 0, alpha: 1 },
      kernel: sharp.kernel.lanczos3,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r <= threshold && g <= threshold && b <= threshold) {
      data[i + 3] = 0;
    }
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(output);

  const meta = await sharp(output).metadata();
  console.log(
    "[fit-studio-vial-to-nad-canvas] wrote",
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
