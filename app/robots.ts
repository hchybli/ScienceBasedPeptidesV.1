import type { MetadataRoute } from "next";
import { DEFAULT_SITE_URL } from "@/lib/site";

const base = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
