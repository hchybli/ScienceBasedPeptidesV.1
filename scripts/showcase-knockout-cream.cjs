/* eslint-disable no-console */
/**
 * Removes outer card/cream background via edge flood-fill. Only pixels that are
 * (1) background-colored AND (2) connected to the image border are cleared.
 *
 * Previous bug: "visited" included non-background pixels, so vial edges were erased.
 * Now we only alpha-clear pixels in `toClear` (true background only).
 *
 * Run: node scripts/showcase-knockout-cream.cjs public/products/showcase/bpc-157-clean-2.png
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const INPUT = process.argv[2] ? path.join(process.cwd(), process.argv[2]) : null;

function dist2(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function sampleBorderColor(data, width, height) {
  let rs = 0;
  let gs = 0;
  let bs = 0;
  let n = 0;
  const step = Math.max(2, Math.floor(Math.min(width, height) / 80));
  for (let x = 0; x < width; x += step) {
    for (const y of [0, height - 1]) {
      const i = (y * width + x) * 4;
      rs += data[i];
      gs += data[i + 1];
      bs += data[i + 2];
      n += 1;
    }
  }
  for (let y = 0; y < height; y += step) {
    for (const x of [0, width - 1]) {
      const i = (y * width + x) * 4;
      rs += data[i];
      gs += data[i + 1];
      bs += data[i + 2];
      n += 1;
    }
  }
  return [Math.round(rs / n), Math.round(gs / n), Math.round(bs / n)];
}

/** Never treat central product art as background (vial + label stay opaque). */
function inCentralSafeEllipse(x, y, width, height) {
  const cx = (width - 1) * 0.5;
  const cy = (height - 1) * 0.5;
  const rx = width * 0.36;
  const ry = height * 0.36;
  if (rx < 1 || ry < 1) return false;
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

function floodBackgroundToClear(data, width, height, br, bg, bb) {
  const visited = new Uint8Array(width * height);
  const toClear = new Uint8Array(width * height);
  const queue = [];
  const maxDist2 = 42 * 42;
  const minL = 72;

  function pixelIdx(x, y) {
    return y * width + x;
  }

  function isBackgroundCandidate(x, y) {
    if (inCentralSafeEllipse(x, y, width, height)) return false;
    const i = (y * width + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 220) return true;
    const l = luminance(r, g, b);
    if (l < minL) return false;
    if (dist2(r, g, b, br, bg, bb) <= maxDist2) return true;
    return false;
  }

  function trySeed(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = pixelIdx(x, y);
    if (visited[p]) return;
    visited[p] = 1;
    if (!isBackgroundCandidate(x, y)) return;
    toClear[p] = 1;
    queue.push([x, y]);
  }

  for (let x = 0; x < width; x += 1) {
    trySeed(x, 0);
    trySeed(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    trySeed(0, y);
    trySeed(width - 1, y);
  }

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const np = pixelIdx(nx, ny);
      if (visited[np]) continue;
      visited[np] = 1;
      if (!isBackgroundCandidate(nx, ny)) continue;
      toClear[np] = 1;
      queue.push([nx, ny]);
    }
  }

  return toClear;
}

async function run() {
  if (!INPUT) {
    console.error("Usage: node scripts/showcase-knockout-cream.cjs <path-to.png>");
    process.exit(1);
  }
  if (!fs.existsSync(INPUT)) {
    console.error("Missing", INPUT);
    process.exit(1);
  }

  const { data, info } = await sharp(INPUT).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const [br, bg, bb] = sampleBorderColor(data, width, height);
  const mask = floodBackgroundToClear(data, width, height, br, bg, bb);

  let cleared = 0;
  for (let p = 0; p < width * height; p += 1) {
    if (!mask[p]) continue;
    const i = p * 4;
    data[i + 3] = 0;
    cleared += 1;
  }

  const tmp = `${INPUT}.tmp.png`;
  await sharp(Buffer.from(data), { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(tmp);
  fs.renameSync(tmp, INPUT);

  console.log(
    `${path.basename(INPUT)}: border≈rgb(${br},${bg},${bb}) cleared ${cleared} px (${((cleared / (width * height)) * 100).toFixed(1)}%).`,
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
