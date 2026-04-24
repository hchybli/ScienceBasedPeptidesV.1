import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const patchSchema = z
  .object({
    batchNumber: z.string().min(1).optional(),
    labName: z.string().min(1).optional(),
    purity: z.number().min(0).max(100).optional(),
    reportUrl: z.string().min(1).optional(),
    testedAt: z.number().int().positive().optional(),
    isCurrent: z.boolean().optional(),
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

  const existing = await prisma.lab_reports.findFirst({ where: { id }, select: { id: true, product_id: true } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const d = parsed.data;
  const update: Record<string, unknown> = {};
  if (d.batchNumber !== undefined) update.batch_number = d.batchNumber;
  if (d.labName !== undefined) update.lab_name = d.labName;
  if (d.purity !== undefined) update.purity = d.purity;
  if (d.reportUrl !== undefined) update.report_url = d.reportUrl;
  if (d.testedAt !== undefined) update.tested_at = BigInt(d.testedAt);
  if (d.isCurrent !== undefined) update.is_current = d.isCurrent ? 1 : 0;

  await prisma.$transaction(async (tx) => {
    if (d.isCurrent) {
      await tx.lab_reports.updateMany({ where: { product_id: existing.product_id }, data: { is_current: 0 } });
      update.is_current = 1;
    }
    await tx.lab_reports.update({ where: { id }, data: update });
  });

  const p = await prisma.products.findFirst({ where: { id: existing.product_id }, select: { slug: true } });
  if (p?.slug) revalidatePath(`/products/${p.slug}`);
  revalidatePath("/shop");
  revalidatePath(`/admin/products/${existing.product_id}/edit`);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const existing = await prisma.lab_reports.findFirst({ where: { id }, select: { product_id: true } });
  await prisma.lab_reports.delete({ where: { id } }).catch(() => null);
  if (existing?.product_id) {
    const p = await prisma.products.findFirst({ where: { id: existing.product_id }, select: { slug: true } });
    if (p?.slug) revalidatePath(`/products/${p.slug}`);
    revalidatePath(`/admin/products/${existing.product_id}/edit`);
  }
  revalidatePath("/shop");
  return NextResponse.json({ ok: true });
}

