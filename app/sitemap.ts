import type { MetadataRoute } from "next";
import getDb from "@/db/index";
import { getMdxSlugs } from "@/lib/mdx";
import { DEFAULT_SITE_URL } from "@/lib/site";

const base = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const db = getDb();
  const products = db.prepare(`SELECT slug, created_at FROM products`).all() as Array<{ slug: string; created_at: number }>;
  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date() },
    { url: `${base}/shop`, lastModified: new Date() },
    { url: `${base}/bundles`, lastModified: new Date() },
    { url: `${base}/research`, lastModified: new Date() },
    { url: `${base}/protocols`, lastModified: new Date() },
    { url: `${base}/about`, lastModified: new Date() },
    { url: `${base}/faq`, lastModified: new Date() },
    { url: `${base}/contact`, lastModified: new Date() },
  ];

  for (const p of products) {
    entries.push({ url: `${base}/products/${p.slug}`, lastModified: new Date(p.created_at * 1000) });
  }

  for (const slug of getMdxSlugs("research")) {
    entries.push({ url: `${base}/research/${slug}`, lastModified: new Date() });
  }
  for (const slug of getMdxSlugs("protocols")) {
    entries.push({ url: `${base}/protocols/${slug}`, lastModified: new Date() });
  }

  return entries;
}
