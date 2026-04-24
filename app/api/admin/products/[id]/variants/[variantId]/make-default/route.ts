import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string; variantId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: productId, variantId } = await ctx.params;

  await prisma.$transaction([
    prisma.variants.updateMany({ where: { product_id: productId }, data: { is_default: 0 } }),
    prisma.variants.update({ where: { id: variantId }, data: { is_default: 1 } }),
  ]);

  const p = await prisma.products.findFirst({ where: { id: productId }, select: { slug: true } });
  if (p?.slug) revalidatePath(`/products/${p.slug}`);
  revalidatePath("/shop");
  revalidatePath(`/admin/products/${productId}/edit`);

  return NextResponse.json({ ok: true });
}

