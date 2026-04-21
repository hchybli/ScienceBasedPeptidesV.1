import { NextResponse } from "next/server";
import { z } from "zod";
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
  return NextResponse.json({ ok: true, variant: { ...updated, is_default: Boolean(updated.is_default) } });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;

  await prisma.variants.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

