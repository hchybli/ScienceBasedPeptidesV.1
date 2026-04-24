import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const patchSchema = z
  .object({
    isApproved: z.boolean().optional(),
    isVerified: z.boolean().optional(),
  })
  .strip();

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
  const update: Record<string, unknown> = {};
  if (d.isApproved !== undefined) update.is_approved = d.isApproved ? 1 : 0;
  if (d.isVerified !== undefined) update.is_verified = d.isVerified ? 1 : 0;
  const existing = await prisma.reviews.findFirst({ where: { id }, select: { product_id: true } });
  await prisma.reviews.update({ where: { id }, data: update }).catch(() => null);
  if (existing?.product_id) {
    const p = await prisma.products.findFirst({ where: { id: existing.product_id }, select: { slug: true } });
    if (p?.slug) revalidatePath(`/products/${p.slug}`);
  }
  revalidatePath("/shop");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const existing = await prisma.reviews.findFirst({ where: { id }, select: { product_id: true } });
  await prisma.reviews.delete({ where: { id } }).catch(() => null);
  if (existing?.product_id) {
    const p = await prisma.products.findFirst({ where: { id: existing.product_id }, select: { slug: true } });
    if (p?.slug) revalidatePath(`/products/${p.slug}`);
  }
  revalidatePath("/shop");
  return NextResponse.json({ ok: true });
}

