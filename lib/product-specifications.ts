import type { ProductMeta } from "@/lib/product-meta";

export type SpecificationRow = { label: string; value: string };

/** Lyophilized / blend / multi-part products we treat as composed formulations. */
export function isBlendProduct(slug: string, name: string): boolean {
  const s = slug.toLowerCase();
  if (s.includes("blend")) return true;
  if (/\+/.test(name)) return true;
  return false;
}

function substitutePresentation(value: string, selectedSize: string): string {
  return value.replace(/\[(SIZE|size)\]/g, selectedSize).trim();
}

function compoundSortKey(label: string): number {
  const l = label.trim().toLowerCase();
  const m = /^compound\s+(\d+)$/.exec(l);
  if (m) return Number.parseInt(m[1]!, 10);
  if (l === "compound") return 100;
  return 50;
}

/**
 * Builds per-product specification rows for PDP tables. Single compounds use catalog
 * fields for identity (not tag `spec:compound`, which can be wrong if DB tags are duplicated).
 * Blends keep ordered compound lines from tags when present.
 */
export function buildPdpSpecificationRows(input: {
  slug: string;
  name: string;
  scientificName: string | null;
  selectedSize: string;
  meta: ProductMeta;
}): SpecificationRow[] {
  const { slug, name, scientificName, selectedSize, meta } = input;
  const tagSpecs = meta.specs;
  const blend = isBlendProduct(slug, name);

  const skipForSingles = new Set([
    "compound",
    "compound 1",
    "compound 2",
    "compound 3",
    "compound 4",
    "quantity",
    "total quantity",
  ]);

  const rows: SpecificationRow[] = [];

  if (blend) {
    const compoundTags = tagSpecs.filter((spec) => {
      const l = spec.label.trim().toLowerCase();
      return l === "compound" || /^compound\s+\d+$/.test(l);
    });
    const ordered =
      compoundTags.length > 0
        ? [...compoundTags].sort((a, b) => compoundSortKey(a.label) - compoundSortKey(b.label))
        : [];

    if (ordered.length > 0) {
      for (const spec of ordered) {
        const v = substitutePresentation(spec.value, selectedSize);
        if (v) rows.push({ label: spec.label.trim(), value: v });
      }
    } else {
      const fallback = tagSpecs.find((s) => s.label.trim().toLowerCase() === "compound");
      if (fallback) {
        const v = substitutePresentation(fallback.value, selectedSize);
        if (v) rows.push({ label: "Composition", value: v });
      } else {
        rows.push({ label: "Product", value: name });
      }
    }

    const totalQ = tagSpecs.find((s) => {
      const l = s.label.trim().toLowerCase();
      return l.includes("total") && l.includes("quant");
    });
    if (totalQ) {
      const v = substitutePresentation(totalQ.value, selectedSize);
      if (v) rows.push({ label: totalQ.label.trim(), value: v });
    } else {
      rows.push({ label: "Presentation", value: selectedSize });
    }

    for (const spec of tagSpecs) {
      const l = spec.label.trim().toLowerCase();
      if (l === "compound" || /^compound\s+\d+$/.test(l)) continue;
      if (l.includes("total") && l.includes("quant")) continue;
      const v = substitutePresentation(spec.value, selectedSize);
      if (!v || v === "[SIZE]") continue;
      rows.push({ label: spec.label.trim(), value: v });
    }
  } else {
    const identity = scientificName?.trim() || name;
    rows.push({ label: "Compound", value: identity });
    rows.push({ label: "Presentation", value: selectedSize });

    for (const spec of tagSpecs) {
      const l = spec.label.trim().toLowerCase();
      if (skipForSingles.has(l)) continue;
      const v = substitutePresentation(spec.value, selectedSize);
      if (!v || v.toLowerCase() === "size") continue;
      rows.push({ label: spec.label.trim(), value: v });
    }
  }

  const seen = new Set<string>();
  return rows.filter((r) => {
    const k = `${r.label}\0${r.value}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
