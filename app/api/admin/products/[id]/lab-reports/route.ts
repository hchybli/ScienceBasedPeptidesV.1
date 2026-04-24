import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const postSchema = z
  .object({
    batchNumber: z.string().min(1),
    labName: z.string().min(1),
    purity: z.number().min(0).max(100),
    reportUrl: z.string().min(1),
    testedAt: z.number().int().positive(),
    isCurrent: z.boolean().optional(),
  })
  .strict();

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: productId } = await ctx.params;
  const rows = await prisma.lab_reports.findMany({
    where: { product_id: productId },
    orderBy: [{ is_current: "desc" }, { tested_at: "desc" }],
  });
  return NextResponse.json({
    labReports: rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      batchNumber: r.batch_number,
      labName: r.lab_name,
      purity: r.purity,
      reportUrl: r.report_url,
      testedAt: Number(r.tested_at),
      isCurrent: Boolean(r.is_current),
      createdAt: Number(r.created_at),
    })),
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: productId } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { batchNumber, labName, purity, reportUrl, testedAt, isCurrent } = parsed.data;
  const id = nanoid();

  await prisma.$transaction(async (tx) => {
    if (isCurrent) {
      await tx.lab_reports.updateMany({ where: { product_id: productId }, data: { is_current: 0 } });
    }
    await tx.lab_reports.create({
      data: {
        id,
        product_id: productId,
        batch_number: batchNumber,
        lab_name: labName,
        purity,
        report_url: reportUrl,
        tested_at: BigInt(testedAt),
        is_current: isCurrent ? 1 : 0,
      },
    });
  });

  const p = await prisma.products.findFirst({ where: { id: productId }, select: { slug: true } });
  if (p?.slug) revalidatePath(`/products/${p.slug}`);
  revalidatePath("/shop");
  revalidatePath(`/admin/products/${productId}/edit`);

  return NextResponse.json({ ok: true, id });
}

