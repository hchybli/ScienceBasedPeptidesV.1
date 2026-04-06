Image slot naming for product uploads:

- `products/bpc-157.png`
- `products/tb-500.png`
- `products/bpc-157-tb-500-blend.png`
- `products/cjc-1295-no-dac.png`
- `products/ipamorelin.png`
- `products/cjc-1295-ipamorelin-blend.png`
- `products/sermorelin.png`
- `products/ghk-cu.png`
- `products/nad-plus.png`
- `products/epitalon.png`
- `products/mots-c.png`
- `products/thymosin-alpha-1.png`
- `products/pt-141.png`
- `products/selank.png`
- `products/semax.png`
- `products/semaglutide.png`
- `products/retatrutide.png`
- `products/melanotan-i.png`
- `products/melanotan-ii.png`
- `products/tesamorelin.png`
- `products/bacteriostatic-water-30ml.png`
- `products/precision-syringes-29g.png`
- `products/alcohol-prep-pads.png`

Each seeded product now includes a `meta:image_slot:products/<slug>.png` tag.

Fast workflow:

- Drop images into `public/products/` using the slug, e.g. `tb-500.png`.
- Optional gallery files can use `slug-1.png`, `slug-2.png`, etc.
- Update copy/spec/aliases in `content/products/product-info.json`.
- Run `npm run seed` to refresh catalog data.
