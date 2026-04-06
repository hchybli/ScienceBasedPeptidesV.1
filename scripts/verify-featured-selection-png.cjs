/* eslint-disable no-console */
/**
 * Featured selection: reject JPEG data saved as `.png` (breaks transparency expectations).
 * Missing alpha is a **warning** only — use hand-exported PNGs with alpha for true knockouts.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DIR = path.join(process.cwd(), "public", "products", "featured-selection");

function magicLabel(buf) {
  if (buf.length < 4) return "empty";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "JPEG";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "PNG";
  return "unknown";
}

async function main() {
  if (!fs.existsSync(DIR)) {
    console.log("[verify-featured-selection-png] no folder, skip");
    return;
  }
  const files = fs.readdirSync(DIR).filter((f) => /\.png$/i.test(f));
  if (files.length === 0) {
    console.log("[verify-featured-selection-png] no PNGs, skip");
    return;
  }

  let failed = false;
  for (const name of files.sort()) {
    const full = path.join(DIR, name);
    const head = fs.readFileSync(full, { start: 0, end: 16 });
    const label = magicLabel(head);
    const meta = await sharp(full).metadata();

    if (label === "JPEG" || meta.format === "jpeg") {
      console.warn(
        `[verify-featured-selection-png] ${name}: file is JPEG data with a .png name — replace with a real PNG export for transparency and sharper edges (no quality loss from re-encoding).`,
      );
      continue;
    }
    if (meta.format !== "png") {
      console.error(`[verify-featured-selection-png] ${name}: unexpected format ${meta.format}`);
      failed = true;
      continue;
    }
    if (meta.hasAlpha !== true) {
      console.warn(
        `[verify-featured-selection-png] ${name}: no alpha channel — background will be opaque until you replace with a PNG export that includes transparency.`,
      );
    }
  }

  if (failed) process.exit(1);
  console.log("[verify-featured-selection-png] done (exit 0; JPEG-as-.png is warn-only — replace with PNG exports when ready)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
