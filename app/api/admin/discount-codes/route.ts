import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { discountTypeSchema } from "@/lib/discounts";

const postSchema = z
  .object({
    code: z.string().min(2).max(50),
    type: discountTypeSchema,
    value: z.number().min(0),
    min_order_value: z.number().min(0).nullable().optional(),
    max_uses: z.number().int().positive().nullable().optional(),
    expires_at: z.number().int().positive().nullable().optional(),
    applicable_product_ids: z.array(z.string()).optional(),
    is_active: z.number().int().min(0).max(1).optional(),
  })
  .strict();

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const codes = await prisma.discount_codes.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json({
    discountCodes: codes.map((c) => ({
      ...c,
      created_at: Number(c.created_at),
      expires_at: c.expires_at != null ? Number(c.expires_at) : null,
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

  const d = parsed.data;
  const created = await prisma.discount_codes.create({
    data: {
      id: nanoid(),
      code: d.code.trim().toUpperCase(),
      type: d.type,
      value: d.value,
      min_order_value: d.min_order_value ?? null,
      max_uses: d.max_uses ?? null,
      used_count: 0,
      expires_at: d.expires_at != null ? BigInt(d.expires_at) : null,
      is_active: d.is_active ?? 1,
      applicable_product_ids: JSON.stringify(d.applicable_product_ids ?? []),
    },
  });

  return NextResponse.json({
    ok: true,
    discountCode: {
      ...created,
      created_at: Number(created.created_at),
      expires_at: created.expires_at != null ? Number(created.expires_at) : null,
    },
  });
}

