import { NextResponse } from "next/server";
import { z } from "zod";
import getDb from "@/db/index";
import { getCurrentUser } from "@/lib/auth";

const patchSchema = z.object({
  intervalDays: z.number().int().optional(),
  pauseUntil: z.number().int().optional(),
  skipNext: z.boolean().optional(),
  swap: z
    .object({
      itemId: z.string(),
      variantId: z.string(),
    })
    .optional(),
  cancelReason: z.string().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const db = getDb();
  const sub = db.prepare(`SELECT * FROM subscriptions WHERE id = ? AND user_id = ?`).get(id, user.userId) as
    | Record<string, unknown>
    | undefined;
  if (!sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const d = parsed.data;
  if (d.intervalDays) {
    db.prepare(`UPDATE subscriptions SET interval_days = ? WHERE id = ?`).run(d.intervalDays, id);
  }
  if (d.pauseUntil) {
    db.prepare(`UPDATE subscriptions SET status = 'paused', paused_until = ? WHERE id = ?`).run(d.pauseUntil, id);
  }
  if (d.skipNext) {
    const interval = sub.interval_days as number;
    db.prepare(`UPDATE subscriptions SET next_billing_date = next_billing_date + ? WHERE id = ?`).run(
      interval * 86400,
      id
    );
  }
  if (d.swap) {
    const v = db
      .prepare(`SELECT price FROM variants WHERE id = ?`)
      .get(d.swap.variantId) as { price: number } | undefined;
    if (v) {
      db.prepare(`UPDATE subscription_items SET variant_id = ?, unit_price = ? WHERE id = ? AND subscription_id = ?`).run(
        d.swap.variantId,
        v.price,
        d.swap.itemId,
        id
      );
    }
  }
  if (d.cancelReason) {
    db.prepare(
      `UPDATE subscriptions SET status = 'cancelled', cancel_reason = ?, cancelled_at = unixepoch() WHERE id = ?`
    ).run(d.cancelReason, id);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const db = getDb();
  const sub = db.prepare(`SELECT id FROM subscriptions WHERE id = ? AND user_id = ?`).get(id, user.userId);
  if (!sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  db.prepare(
    `UPDATE subscriptions SET status = 'cancelled', cancelled_at = unixepoch(), cancel_reason = 'user_cancelled' WHERE id = ?`
  ).run(id);
  return NextResponse.json({ ok: true });
}
