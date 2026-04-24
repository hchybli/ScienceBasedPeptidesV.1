import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const postSchema = z
  .object({
    size: z.string().min(1),
    price: z.number().positive(),
    compare_at: z.number().positive().nullable().optional(),
    sku: z.string().min(1),
    stock_qty: z.number().int().min(0).optional(),
    low_stock_threshold: z.number().int().min(0).optional(),
    is_default: z.number().int().min(0).max(1).optional(),
    display_order: z.number().int().min(0).optional(),
  })
  .strict();

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: productId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const id = nanoid();
  const d = parsed.data;

  if (d.is_default) {
    const [, variant] = await prisma.$transaction([
      prisma.variants.updateMany({ where: { product_id: productId }, data: { is_default: 0 } }),
      prisma.variants.create({
        data: {
          id,
          product_id: productId,
          size: d.size,
          price: d.price,
          compare_at: d.compare_at ?? null,
          sku: d.sku,
          stock_qty: d.stock_qty ?? 0,
          low_stock_threshold: d.low_stock_threshold ?? 10,
          is_default: 1,
          display_order: d.display_order ?? 0,
        },
      }),
    ]);
    return NextResponse.json({ ok: true, variant: { ...variant, is_default: Boolean(variant.is_default) } });
  }

  const variant = await prisma.variants.create({
    data: {
      id,
      product_id: productId,
      size: d.size,
      price: d.price,
      compare_at: d.compare_at ?? null,
      sku: d.sku,
      stock_qty: d.stock_qty ?? 0,
      low_stock_threshold: d.low_stock_threshold ?? 10,
      is_default: d.is_default ?? 0,
      display_order: d.display_order ?? 0,
    },
  });

  const p = await prisma.products.findFirst({ where: { id: productId }, select: { slug: true } });
  if (p?.slug) revalidatePath(`/products/${p.slug}`);
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);

  return NextResponse.json({ ok: true, variant: { ...variant, is_default: Boolean(variant.is_default) } });
}

