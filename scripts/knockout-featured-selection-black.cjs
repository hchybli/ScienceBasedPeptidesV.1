/* eslint-disable no-console */
/**
 * @deprecated Do not run. Automated background removal caused halos, jagged edges, and
 * quality loss. Featured Selection uses **raw** files in `public/products/featured-selection/`
 * (hand-exported PNGs with alpha). This script is kept only so old npm scripts don’t 404.
 */
console.error(`
[knockout-featured-selection-black] DEPRECATED — removed to preserve original vial quality.

Place PNG exports (with transparency) directly in:
  public/products/featured-selection/

Filenames are mapped in lib/featured-selection-images.ts
`);
process.exit(0);
