import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const patchSchema = z
  .object({
    size: z.string().min(1).optional(),
    price: z.number().positive().optional(),
    compare_at: z.number().positive().nullable().optional(),
    sku: z.string().min(1).optional(),
    stock_qty: z.number().int().min(0).optional(),
    low_stock_threshold: z.number().int().min(0).optional(),
    is_default: z.number().int().min(0).max(1).optional(),
    display_order: z.number().int().min(0).optional(),
  })
  .strict();

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const updated = await prisma.variants.update({ where: { id }, data: parsed.data });

  const p = await prisma.products.findFirst({ where: { id: updated.product_id }, select: { slug: true } });
  if (p?.slug) revalidatePath(`/products/${p.slug}`);
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${updated.product_id}/edit`);

  return NextResponse.json({ ok: true, variant: { ...updated, is_default: Boolean(updated.is_default) } });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const existing = await prisma.variants.findFirst({ where: { id }, select: { product_id: true } });
  await prisma.variants.delete({ where: { id } });
  if (existing?.product_id) {
    const p = await prisma.products.findFirst({ where: { id: existing.product_id }, select: { slug: true } });
    if (p?.slug) revalidatePath(`/products/${p.slug}`);
    revalidatePath(`/admin/products/${existing.product_id}/edit`);
  }
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  return NextResponse.json({ ok: true });
}

