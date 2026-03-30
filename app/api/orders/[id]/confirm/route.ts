import { NextResponse } from "next/server";
import { z } from "zod";
import getDb from "@/db/index";
import { getCurrentUser } from "@/lib/auth";
import { awardPointsForOrder } from "@/lib/loyalty";
import { markReferralConverted } from "@/lib/referral";
import { sendOrderShippedEmail } from "@/lib/email";

const schema = z.object({
  status: z.enum(["confirmed", "processing", "shipped", "delivered"]).optional(),
  trackingNumber: z.string().optional(),
  trackingCarrier: z.string().optional(),
  trackingUrl: z.string().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const db = getDb();
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id) as
    | {
        id: string;
        user_id: string | null;
        status: string;
        total: number;
        is_subscription_order: number;
        loyalty_points_earned: number;
      }
    | undefined;
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = Math.floor(Date.now() / 1000);

  if (parsed.data.status === "confirmed" && order.status !== "confirmed") {
    db.prepare(`UPDATE orders SET status = 'confirmed', confirmed_at = ? WHERE id = ?`).run(now, id);
    if (order.user_id) {
      const pts = awardPointsForOrder({
        userId: order.user_id,
        orderId: id,
        orderTotalUsd: order.total,
        isSubscription: Boolean(order.is_subscription_order),
      });
      db.prepare(`UPDATE orders SET loyalty_points_earned = ? WHERE id = ?`).run(pts, id);
      db.prepare(`UPDATE users SET last_purchase_at = ? WHERE id = ?`).run(now, order.user_id);
      markReferralConverted(order.user_id);
    }
  }

  if (parsed.data.trackingNumber && parsed.data.trackingCarrier) {
    db.prepare(
      `UPDATE orders SET tracking_number = ?, tracking_carrier = ?, tracking_url = ?, status = 'shipped', shipped_at = ? WHERE id = ?`
    ).run(
      parsed.data.trackingNumber,
      parsed.data.trackingCarrier,
      parsed.data.trackingUrl ?? null,
      now,
      id
    );
    const u = order.user_id
      ? (db.prepare(`SELECT email, name FROM users WHERE id = ?`).get(order.user_id) as {
          email: string;
          name: string | null;
        })
      : null;
    if (u) {
      void sendOrderShippedEmail({
        email: u.email,
        name: u.name ?? "",
        orderId: id,
        trackingNumber: parsed.data.trackingNumber,
        trackingCarrier: parsed.data.trackingCarrier,
        trackingUrl: parsed.data.trackingUrl,
      });
    }
  }

  if (parsed.data.status === "delivered") {
    db.prepare(`UPDATE orders SET status = 'delivered', delivered_at = ? WHERE id = ?`).run(now, id);
  }

  return NextResponse.json({ ok: true });
}
