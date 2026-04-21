import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const postSchema = z
  .object({
    variantId: z.string().min(1),
    delta: z.number().int(),
    reason: z.string().max(500).optional(),
  })
  .strict();

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const variantId = url.searchParams.get("variantId");
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || "50")));
  if (!variantId) return NextResponse.json({ error: "Missing variantId" }, { status: 400 });

  const rows = await prisma.inventory_adjustments.findMany({
    where: { variant_id: variantId },
    orderBy: { created_at: "desc" },
    take: limit,
  });

  return NextResponse.json({
    adjustments: rows.map((r) => ({
      ...r,
      created_at: Number(r.created_at),
    })),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { variantId, delta, reason } = parsed.data;
  if (delta === 0) return NextResponse.json({ error: "Delta cannot be 0" }, { status: 400 });

  const id = nanoid();
  const [adj] = await prisma.$transaction([
    prisma.inventory_adjustments.create({
      data: {
        id,
        variant_id: variantId,
        delta,
        reason: reason ?? null,
      },
    }),
    prisma.variants.update({
      where: { id: variantId },
      data: { stock_qty: { increment: delta } },
      select: { id: true },
    }),
  ]);

  return NextResponse.json({ ok: true, adjustment: { ...adj, created_at: Number(adj.created_at) } });
}

