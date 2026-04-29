import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/utils";
import {
  appliedDiscountSchema,
  normalizeDiscountType,
  validateDiscountCodeConstraints,
} from "@/lib/discounts";

const schema = z.object({
  code: z.string().min(1),
  subtotal: z.number().nonnegative(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { code, subtotal } = parsed.data;
  const row = await prisma.discount_codes.findFirst({
    where: {
      code: { equals: code, mode: "insensitive" },
      is_active: 1,
    },
  });

  if (!row) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const constraintError = validateDiscountCodeConstraints({
    subtotal,
    minOrderValue: row.min_order_value,
    maxUses: row.max_uses,
    usedCount: row.used_count,
    expiresAt: row.expires_at != null ? Number(row.expires_at) : null,
    isActive: row.is_active,
  });
  if (constraintError) {
    return NextResponse.json({ error: constraintError }, { status: 400 });
  }

  const type = normalizeDiscountType(row.type);
  if (!type) {
    return NextResponse.json({ error: "Code type not supported" }, { status: 400 });
  }

  const applicable = parseJsonArray<string>(row.applicable_product_ids, []);
  const discount = appliedDiscountSchema.parse({
    code: row.code,
    type,
    value: row.value,
  });

  return NextResponse.json({
    discount: { ...discount, applicableProductIds: applicable },
  });
}
