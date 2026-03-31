export type ProductMeta = {
  type: string;
  brand: string;
  family: string;
  form: string;
  batch: string;
  imageSlot: string | null;
  aliases: string[];
  specs: Array<{ label: string; value: string }>;
};

const DEFAULT_META: ProductMeta = {
  type: "Research Peptide",
  brand: "SCIENCE BASED PEPTIDES",
  family: "Peptides",
  form: "Lyophilized Powder",
  batch: "SBP-001",
  imageSlot: null,
  aliases: [],
  specs: [],
};

const PREFIX = "meta:";
const ALIAS_PREFIX = "alias:";
const SPEC_PREFIX = "spec:";

export function parseProductMeta(tags: string[]): ProductMeta {
  const next: ProductMeta = { ...DEFAULT_META };
  for (const tag of tags) {
    if (tag.startsWith(ALIAS_PREFIX)) {
      const alias = tag.slice(ALIAS_PREFIX.length).trim();
      if (alias) next.aliases.push(alias);
      continue;
    }
    if (tag.startsWith(SPEC_PREFIX)) {
      const body = tag.slice(SPEC_PREFIX.length);
      const split = body.indexOf(":");
      if (split !== -1) {
        const label = body.slice(0, split).trim();
        const value = body.slice(split + 1).trim();
        if (label && value) next.specs.push({ label, value });
      }
      continue;
    }
    if (!tag.startsWith(PREFIX)) continue;
    const body = tag.slice(PREFIX.length);
    const split = body.indexOf(":");
    if (split === -1) continue;
    const key = body.slice(0, split).trim();
    const value = body.slice(split + 1).trim();
    if (!value) continue;
    if (key === "type") next.type = value;
    if (key === "brand") next.brand = value;
    if (key === "family") next.family = value;
    if (key === "form") next.form = value;
    if (key === "batch") next.batch = value;
    if (key === "image_slot") next.imageSlot = value;
  }
  next.aliases = Array.from(new Set(next.aliases));
  next.specs = next.specs.filter((s, index, arr) => arr.findIndex((x) => x.label === s.label && x.value === s.value) === index);
  return next;
}
