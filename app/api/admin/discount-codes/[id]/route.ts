import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { discountTypeSchema } from "@/lib/discounts";

const patchSchema = z
  .object({
    code: z.string().min(2).max(50).optional(),
    type: discountTypeSchema.optional(),
    value: z.number().min(0).optional(),
    min_order_value: z.number().min(0).nullable().optional(),
    max_uses: z.number().int().positive().nullable().optional(),
    expires_at: z.number().int().positive().nullable().optional(),
    applicable_product_ids: z.array(z.string()).optional(),
    is_active: z.number().int().min(0).max(1).optional(),
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

  const d = parsed.data;
  const data: Record<string, unknown> = { ...d };
  if (typeof d.code === "string") data.code = d.code.trim().toUpperCase();
  if (d.applicable_product_ids) data.applicable_product_ids = JSON.stringify(d.applicable_product_ids);
  if ("expires_at" in d) data.expires_at = d.expires_at != null ? BigInt(d.expires_at) : null;

  const updated = await prisma.discount_codes.update({ where: { id }, data });
  return NextResponse.json({
    ok: true,
    discountCode: {
      ...updated,
      created_at: Number(updated.created_at),
      expires_at: updated.expires_at != null ? Number(updated.expires_at) : null,
    },
  });
}

