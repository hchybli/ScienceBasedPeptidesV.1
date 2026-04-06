/* eslint-disable no-console */
/**
 * Fails the build if homepage hero/stack files are not real PNGs (RGBA).
 * Many "save as PNG" flows from web tools still write JPEG bytes with a .png extension —
 * Windows shows "PNG" from the extension, but the bytes are JPEG (no transparency).
 *
 * Run automatically from `prebuild` after `images:match-backgrounds`.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const FILES = ["public/hero-home-stack.png", "public/stack-builder-vials.png"];

function magicLabel(buf) {
  if (buf.length < 3) return "empty/short";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "JPEG";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "PNG";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return "WEBP";
  return "unknown";
}

async function main() {
  if (process.env.SKIP_HOMEPAGE_PNG_VERIFY === "1") {
    console.warn("[verify-homepage-png] skipped (SKIP_HOMEPAGE_PNG_VERIFY=1)");
    return;
  }

  let failed = false;
  for (const rel of FILES) {
    const full = path.join(process.cwd(), rel);
    if (!fs.existsSync(full)) {
      console.warn(`[verify-homepage-png] skip (missing): ${rel}`);
      continue;
    }
    const head = fs.readFileSync(full, { start: 0, end: 12 });
    const label = magicLabel(head);
    const meta = await sharp(full).metadata();

    if (label === "JPEG" || meta.format === "jpeg" || meta.format === "jpg") {
      console.error(`
----------------------------------------------------------------------
  INVALID FILE: ${rel}

  First bytes are JPEG (FF D8 FF), not PNG (89 50 4E 47).
  sharp reports format: ${meta.format} -- JPEG has NO transparency.

  Your tool may label the download ".png" or "PNG" in Explorer, but the
  actual file content is JPEG. Re-export as a true PNG or WebP with alpha
  (open in an image app -> Save As PNG, or use a different export preset).

  This repo does not convert these files; whatever you place in public/
  is served as-is.
----------------------------------------------------------------------
`);
      failed = true;
      continue;
    }

    if (label !== "PNG" && label !== "WEBP") {
      console.warn(`[verify-homepage-png] ${rel}: unexpected magic ${label}, format=${meta.format}`);
    }
    if (meta.hasAlpha === false && meta.format === "png") {
      console.warn(`[verify-homepage-png] ${rel}: PNG has no alpha channel — background may be opaque.`);
    }
  }

  if (failed) {
    if (process.env.STRICT_HOMEPAGE_PNG_VERIFY === "1") {
      process.exit(1);
    }
    process.exit(0);
  }
  console.log("[verify-homepage-png] hero + stack assets OK (real PNG/WebP, not JPEG-as-.png).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
