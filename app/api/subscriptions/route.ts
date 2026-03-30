import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import getDb from "@/db/index";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  const subs = db.prepare(`SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC`).all(user.userId) as Array<Record<string, unknown>>;
  const out = subs.map((s) => {
    const items = db.prepare(`SELECT * FROM subscription_items WHERE subscription_id = ?`).all(s.id) as Array<Record<string, unknown>>;
    return { ...s, items };
  });
  return NextResponse.json({ subscriptions: out });
}

const postSchema = z.object({
  intervalDays: z.number().int().min(30).max(90),
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })
  ),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const db = getDb();
  const sid = nanoid();
  const nextBill = Math.floor(Date.now() / 1000) + parsed.data.intervalDays * 86400;
  db.prepare(
    `INSERT INTO subscriptions (id, user_id, status, interval_days, next_billing_date, discount_percent) VALUES (?, ?, 'active', ?, ?, 0.15)`
  ).run(sid, user.userId, parsed.data.intervalDays, nextBill);
  for (const it of parsed.data.items) {
    db.prepare(
      `INSERT INTO subscription_items (id, subscription_id, product_id, variant_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(nanoid(), sid, it.productId, it.variantId, it.quantity, it.unitPrice);
  }
  return NextResponse.json({ id: sid });
}
