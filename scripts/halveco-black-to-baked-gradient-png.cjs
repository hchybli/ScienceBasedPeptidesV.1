/* eslint-disable no-console */
/**
 * HALVECO studio shot (#000 bg) → **opaque** 1024×682 shop PNG (CJC / BPC style: solid studio fill
 * behind the vial, no CSS frame gradient). Default: **solid** label-matched color; optional `gradient`
 * bakes the old theme linear-gradient instead.
 *
 * Keys black with binary max(R,G,B) > T — **no** alpha-channel blur.
 * Composites: out = src * a + bg * (255-a) per channel.
 *
 * Usage:
 *   node scripts/halveco-black-to-baked-gradient-png.cjs <input.png> <output.png> <slug> [gradient] [T]
 *   T: binary threshold (default 38).
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

/** Solid fills aligned with each label family (same intent as former CSS frame gradients). */
const SOLID_BG = {
  semax: "#e8a020",
  selank: "#5b4d98",
  "thymosin-alpha-1": "#982878",
  dsip: "#1c5c82",
};

const GRADIENTS = {
  semax: {
    angle: 168,
    stops: [
      { pos: 0, hex: "#b84a12" },
      { pos: 0.48, hex: "#e8a020" },
      { pos: 1, hex: "#fce45a" },
    ],
  },
  selank: {
    angle: 95,
    stops: [
      { pos: 0, hex: "#e87820" },
      { pos: 0.42, hex: "#8a6bb8" },
      { pos: 1, hex: "#1c4a9e" },
    ],
  },
  "thymosin-alpha-1": {
    angle: 92,
    stops: [
      { pos: 0, hex: "#d06018" },
      { pos: 0.45, hex: "#b02868" },
      { pos: 1, hex: "#3a1878" },
    ],
  },
  dsip: {
    angle: 142,
    stops: [
      { pos: 0, hex: "#2a8f50" },
      { pos: 0.55, hex: "#1e5090" },
      { pos: 1, hex: "#152d78" },
    ],
  },
};

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function colorAtStops(t, stopsRgb) {
  const s = stopsRgb;
  if (t <= s[0].pos) return s[0];
  if (t >= s[s.length - 1].pos) return s[s.length - 1];
  for (let i = 0; i < s.length - 1; i += 1) {
    if (t <= s[i + 1].pos) {
      const u = (t - s[i].pos) / (s[i + 1].pos - s[i].pos);
      return {
        r: Math.round(lerp(s[i].r, s[i + 1].r, u)),
        g: Math.round(lerp(s[i].g, s[i + 1].g, u)),
        b: Math.round(lerp(s[i].b, s[i + 1].b, u)),
      };
    }
  }
  return s[s.length - 1];
}

function gradientRgbAt(x, y, w, h, angleDeg, stopsRgb) {
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const rad = (angleDeg * Math.PI) / 180;
  const ux = Math.sin(rad);
  const uy = -Math.cos(rad);
  let dmin = Infinity;
  let dmax = -Infinity;
  const corners = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ];
  for (const [px, py] of corners) {
    const d = (px - cx) * ux + (py - cy) * uy;
    dmin = Math.min(dmin, d);
    dmax = Math.max(dmax, d);
  }
  const d = (x - cx) * ux + (y - cy) * uy;
  const span = dmax - dmin;
  const t = span <= 1e-6 ? 0 : (d - dmin) / span;
  const tc = Math.max(0, Math.min(1, t));
  return colorAtStops(tc, stopsRgb);
}

async function main() {
  const input = process.argv[2];
  const output = process.argv[3];
  const slug = process.argv[4];
  const useGradient = process.argv[5] === "gradient";
  const tBin = Number(process.argv[6] ?? 38);

  if (!input || !output || !slug) {
    console.error(
      "Usage: node halveco-black-to-baked-gradient-png.cjs <input> <output> <slug> [gradient] [T]",
    );
    process.exit(1);
  }
  const g = GRADIENTS[slug];
  const solid = SOLID_BG[slug];
  if (!g || !solid) {
    console.error("Unknown slug:", slug, "— expected one of:", Object.keys(GRADIENTS).join(", "));
    process.exit(1);
  }
  if (!fs.existsSync(input)) {
    console.error("Missing input:", input);
    process.exit(1);
  }

  const solidRgb = hexToRgb(solid);
  const stopsRgb = g.stops.map((s) => ({
    pos: s.pos,
    ...hexToRgb(s.hex),
  }));

  const resized = await sharp(input)
    .resize(1024, 682, { fit: "cover", position: "centre" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized;
  const { width, height } = info;
  const n = width * height;
  const fg = new Uint8Array(n);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const r = data[i];
    const gch = data[i + 1];
    const b = data[i + 2];
    const v = Math.max(r, gch, b);
    fg[p] = v > tBin ? 1 : 0;
  }
  // 1px binary erosion: drop boundary foreground pixels (mis-keyed AA fringe on #000).
  const fgE = new Uint8Array(n);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = y * width + x;
      if (!fg[p]) {
        fgE[p] = 0;
        continue;
      }
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        fgE[p] = 0;
        continue;
      }
      fgE[p] =
        fg[p - width] && fg[p + width] && fg[p - 1] && fg[p + 1] ? 1 : 0;
    }
  }

  const out = Buffer.alloc(n * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = y * width + x;
      const i = p * 4;
      const r = data[i];
      const gch = data[i + 1];
      const b = data[i + 2];
      const a = fgE[p] ? 255 : 0;

      const bg = useGradient
        ? gradientRgbAt(x, y, width, height, g.angle, stopsRgb)
        : solidRgb;
      const oi = p * 3;
      const inv = (255 - a) / 255;
      const av = a / 255;
      out[oi] = Math.round(r * av + bg.r * inv);
      out[oi + 1] = Math.round(gch * av + bg.g * inv);
      out[oi + 2] = Math.round(b * av + bg.b * inv);
    }
  }

  await sharp(out, { raw: { width, height, channels: 3 } })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(output);

  const st = fs.statSync(output);
  console.log(
    "[halveco-black-to-baked-gradient-png] wrote",
    path.basename(output),
    slug,
    `${width}x${height}`,
    `${Math.round(st.size / 1024)}KB`,
    useGradient ? "gradient" : "solid",
    `binary>${tBin}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
