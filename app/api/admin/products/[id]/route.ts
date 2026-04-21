import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonArray } from "@/lib/utils";

const patchSchema = z
  .object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    short_description: z.string().min(1).nullable().optional(),
    scientific_name: z.string().min(1).nullable().optional(),
    category_id: z.string().min(1).optional(),
    images: z.array(z.string()).optional(),
    base_price: z.number().positive().optional(),
    compare_price_at: z.number().positive().nullable().optional(),
    cost_of_goods: z.number().positive().nullable().optional(),
    sku: z.string().min(1).optional(),
    purity: z.number().positive().nullable().optional(),
    molecular_formula: z.string().min(1).nullable().optional(),
    cas_number: z.string().min(1).nullable().optional(),
    storage_instructions: z.string().min(1).nullable().optional(),
    cycle_length_days: z.number().int().positive().nullable().optional(),
    is_active: z.number().int().min(0).max(1).optional(),
    is_featured: z.number().int().min(0).max(1).optional(),
    is_best_seller: z.number().int().min(0).max(1).optional(),
    subscription_eligible: z.number().int().min(0).max(1).optional(),
    subscription_discount: z.number().min(0).max(1).optional(),
    tags: z.array(z.string()).optional(),
    seo_title: z.string().min(1).nullable().optional(),
    seo_description: z.string().min(1).nullable().optional(),
  })
  .strict();

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const product = await prisma.products.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [category, variants] = await Promise.all([
    prisma.categories.findUnique({ where: { id: product.category_id }, select: { id: true, name: true, slug: true } }),
    prisma.variants.findMany({ where: { product_id: id }, orderBy: [{ is_default: "desc" }, { display_order: "asc" }] }),
  ]);

  return NextResponse.json({
    product: {
      ...product,
      created_at: Number(product.created_at),
      tags: parseJsonArray<string>(product.tags, []),
      images: parseJsonArray<string>(product.images, []),
      category,
    },
    variants: variants.map((v: (typeof variants)[number]) => ({
      ...v,
      is_default: Boolean(v.is_default),
    })),
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const d = parsed.data;
  const update: Record<string, unknown> = { ...d };
  if (d.images) update.images = JSON.stringify(d.images);
  if (d.tags) update.tags = JSON.stringify(d.tags);

  const saved = await prisma.products.update({
    where: { id },
    data: update,
  });

  return NextResponse.json({
    ok: true,
    product: {
      ...saved,
      created_at: Number(saved.created_at),
      tags: parseJsonArray<string>(saved.tags, []),
      images: parseJsonArray<string>(saved.images, []),
    },
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const variantIds = await prisma.variants.findMany({ where: { product_id: id }, select: { id: true } });
  const ids = variantIds.map((v: (typeof variantIds)[number]) => v.id);

  await prisma.$transaction([
    prisma.inventory_adjustments.deleteMany({ where: { variant_id: { in: ids } } }),
    prisma.subscription_items.deleteMany({ where: { OR: [{ product_id: id }, { variant_id: { in: ids } }] } }),
    prisma.bundle_items.deleteMany({ where: { OR: [{ product_id: id }, { variant_id: { in: ids } }] } }),
    prisma.reviews.deleteMany({ where: { product_id: id } }),
    prisma.lab_reports.deleteMany({ where: { product_id: id } }),
    prisma.related_products.deleteMany({ where: { OR: [{ product_id: id }, { related_id: id }] } }),
    prisma.variants.deleteMany({ where: { product_id: id } }),
    prisma.products.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}

