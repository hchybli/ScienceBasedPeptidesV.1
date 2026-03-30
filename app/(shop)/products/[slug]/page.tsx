import type { Metadata } from "next";
import { notFound } from "next/navigation";
import getDb from "@/db/index";
import { ProductPdp } from "@/components/shop/product-pdp";
import { parseJsonArray } from "@/lib/utils";
import { productJsonLd, siteMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(ctx: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await ctx.params;
  const db = getDb();
  const p = db.prepare(`SELECT name, seo_title, seo_description, base_price FROM products WHERE slug = ?`).get(slug) as
    | { name: string; seo_title: string | null; seo_description: string | null; base_price: number }
    | undefined;
  if (!p) return siteMetadata();
  return {
    ...siteMetadata({
      title: p.seo_title ?? p.name,
      description: p.seo_description ?? undefined,
    }),
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const p = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug FROM products p
       JOIN categories c ON c.id = p.category_id WHERE p.slug = ? AND p.is_active = 1`
    )
    .get(slug) as Record<string, unknown> | undefined;
  if (!p) notFound();

  const variants = db
    .prepare(`SELECT * FROM variants WHERE product_id = ? ORDER BY display_order ASC`)
    .all(p.id) as Array<Record<string, unknown>>;

  const labs = db
    .prepare(`SELECT * FROM lab_reports WHERE product_id = ? ORDER BY tested_at DESC`)
    .all(p.id) as Array<Record<string, unknown>>;

  const reviews = db
    .prepare(
      `SELECT r.*, u.name AS user_name FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? AND r.is_approved = 1 ORDER BY r.created_at DESC LIMIT 50`
    )
    .all(p.id) as Array<Record<string, unknown>>;

  const related = db
    .prepare(
      `SELECT p2.id, p2.name, p2.slug, p2.short_description, p2.images, v.price, v.id AS variant_id, v.size
       FROM related_products rp
       JOIN products p2 ON p2.id = rp.related_id
       JOIN variants v ON v.product_id = p2.id AND v.is_default = 1
       WHERE rp.product_id = ? LIMIT 12`
    )
    .all(p.id) as Array<Record<string, unknown>>;

  const jsonLd = productJsonLd({
    name: p.name as string,
    description: (p.short_description as string) || (p.description as string),
    slug: p.slug as string,
    price: variants[0] ? (variants[0].price as number) : (p.base_price as number),
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductPdp
        product={{
          id: p.id as string,
          name: p.name as string,
          slug: p.slug as string,
          description: p.description as string,
          shortDescription: p.short_description as string | null,
          scientificName: p.scientific_name as string | null,
          categoryName: p.category_name as string,
          categorySlug: p.category_slug as string,
          images: parseJsonArray<string>(p.images as string, []),
          purity: p.purity as number | null,
          molecularFormula: p.molecular_formula as string | null,
          casNumber: p.cas_number as string | null,
          storageInstructions: p.storage_instructions as string | null,
          cycleLengthDays: p.cycle_length_days as number | null,
          subscriptionEligible: Boolean(p.subscription_eligible),
          subscriptionDiscount: p.subscription_discount as number,
          tags: parseJsonArray<string>(p.tags as string, []),
        }}
        variants={variants.map((v) => ({
          id: v.id as string,
          size: v.size as string,
          price: v.price as number,
          compareAt: v.compare_at as number | null,
          stockQty: v.stock_qty as number,
          lowStockThreshold: v.low_stock_threshold as number,
        }))}
        labReports={labs.map((l) => ({
          labName: l.lab_name as string,
          batchNumber: l.batch_number as string,
          purity: l.purity as number,
          reportUrl: l.report_url as string,
          testedAt: l.tested_at as number,
          isCurrent: Boolean(l.is_current),
        }))}
        reviews={reviews.map((r) => ({
          id: r.id as string,
          rating: r.rating as number,
          title: r.title as string | null,
          body: r.body as string,
          userName: r.user_name as string | null,
        }))}
        related={related.map((r) => ({
          id: r.id as string,
          name: r.name as string,
          slug: r.slug as string,
          price: r.price as number,
          variant_id: r.variant_id as string,
          size: r.size as string,
        }))}
      />
    </>
  );
}
