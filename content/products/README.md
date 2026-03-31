Use `product-info.json` to update product copy and image mappings without editing seed code.

Supported fields per slug:

- `short_description`
- `description`
- `scientific_name`
- `aliases` (array of strings)
- `images` (array of `/products/...` paths)
- `tags` (array of strings)
- `variants` (full replacement array)
- `structure`:
  - `type`
  - `brand`
  - `family` (`Peptides` | `Blends` | `Solutions`)
  - `form`
  - `batch`
  - `image_slot`

Workflow:

1. Drop image files into `public/products`.
2. Update `content/products/product-info.json`.
3. Run `npm run seed:sync` for quick incremental updates as products are added.
4. Use `npm run seed` only when you want a full database reset.
