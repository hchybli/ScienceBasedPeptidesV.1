import { NextResponse } from "next/server";
import { z } from "zod";
import getDb from "@/db/index";
import { parseJsonArray } from "@/lib/utils";

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
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM discount_codes WHERE UPPER(code) = UPPER(?) AND is_active = 1`)
    .get(code) as
    | {
        id: string;
        code: string;
        type: string;
        value: number;
        min_order_value: number | null;
        max_uses: number | null;
        used_count: number;
        expires_at: number | null;
        applicable_product_ids: string | null;
      }
    | undefined;

  if (!row) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }
  const now = Math.floor(Date.now() / 1000);
  if (row.expires_at && row.expires_at < now) {
    return NextResponse.json({ error: "Code expired" }, { status: 400 });
  }
  if (row.max_uses != null && row.used_count >= row.max_uses) {
    return NextResponse.json({ error: "Code no longer available" }, { status: 400 });
  }
  if (row.min_order_value != null && subtotal < row.min_order_value) {
    return NextResponse.json({ error: `Minimum order $${row.min_order_value}` }, { status: 400 });
  }

  const applicable = parseJsonArray<string>(row.applicable_product_ids, []);
  return NextResponse.json({
    discount: {
      code: row.code,
      type: row.type,
      value: row.value,
      applicableProductIds: applicable,
    },
  });
}
