import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import getDb from "@/db/index";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonArray } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT r.*, u.name AS user_name FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? AND r.is_approved = 1 ORDER BY r.created_at DESC`
    )
    .all(productId);
  return NextResponse.json({ reviews: rows });
}

const postSchema = z.object({
  productId: z.string(),
  orderId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().min(10).max(5000),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  }
  const { productId, orderId, rating, title, body: reviewBody } = parsed.data;
  const db = getDb();

  const orders = db
    .prepare(`SELECT * FROM orders WHERE user_id = ? AND status = 'delivered'`)
    .all(user.userId) as Array<{ id: string; items: string }>;

  let ok = false;
  for (const o of orders) {
    const items = parseJsonArray<{ productId: string }>(o.items, []);
    if (items.some((i) => i.productId === productId)) {
      ok = true;
      break;
    }
  }
  if (!ok) {
    return NextResponse.json({ error: "Verified purchase required" }, { status: 403 });
  }

  const id = nanoid();
  db.prepare(
    `INSERT INTO reviews (id, product_id, user_id, order_id, rating, title, body, is_verified, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)`
  ).run(id, productId, user.userId, orderId ?? null, rating, title ?? null, reviewBody);
  return NextResponse.json({ id, pending: true });
}
