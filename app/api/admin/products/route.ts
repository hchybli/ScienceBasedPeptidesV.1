import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      p.id,
      p.name,
      p.sku,
      p.is_active,
      p.created_at,
      c.name AS category_name,
      COUNT(v.id) AS variant_count,
      COALESCE(SUM(CASE WHEN v.stock_qty <= v.low_stock_threshold THEN 1 ELSE 0 END), 0) AS low_stock_count
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN variants v ON v.product_id = p.id
    GROUP BY p.id, c.name
    ORDER BY p.name ASC
  `);

  const products = (rows as Array<Record<string, unknown>>).map((r) => ({
    ...r,
    created_at: typeof r.created_at === "bigint" ? Number(r.created_at) : r.created_at,
    variant_count: typeof r.variant_count === "bigint" ? Number(r.variant_count) : r.variant_count,
    low_stock_count: typeof r.low_stock_count === "bigint" ? Number(r.low_stock_count) : r.low_stock_count,
  }));

  return NextResponse.json({ products });
}
