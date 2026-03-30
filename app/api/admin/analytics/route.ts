import { NextResponse } from "next/server";
import getDb from "@/db/index";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonArray } from "@/lib/utils";

interface LineSnap {
  productId?: string;
  quantity?: number;
  price?: number;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const day = 86400;
  const startToday = now - (now % day);
  const startWeek = startToday - 6 * day;
  const startMonth = now - 30 * day;
  const start30 = now - 30 * day;

  const revenue = (from: number) =>
    (
      db
        .prepare(
          `SELECT COALESCE(SUM(total), 0) as s FROM orders WHERE status NOT IN ('cancelled', 'refunded', 'pending_payment') AND created_at >= ?`
        )
        .get(from) as { s: number }
    ).s;

  const byStatus = db.prepare(`SELECT status, COUNT(*) as c FROM orders GROUP BY status`).all() as Array<{
    status: string;
    c: number;
  }>;

  const aovAll =
    (
      db
        .prepare(
          `SELECT AVG(total) as a FROM orders WHERE status NOT IN ('cancelled', 'refunded', 'pending_payment')`
        )
        .get() as { a: number | null }
    ).a ?? 0;

  const aov30 =
    (
      db
        .prepare(
          `SELECT AVG(total) as a FROM orders WHERE status NOT IN ('cancelled', 'refunded', 'pending_payment') AND created_at >= ?`
        )
        .get(start30) as { a: number | null }
    ).a ?? 0;

  const repeat = db.prepare(
    `SELECT COUNT(DISTINCT user_id) as u FROM orders WHERE user_id IS NOT NULL`
  ).get() as { u: number };
  const multi = db.prepare(
    `SELECT COUNT(*) as c FROM (SELECT user_id FROM orders WHERE user_id IS NOT NULL GROUP BY user_id HAVING COUNT(*) >= 2)`
  ).get() as { c: number };
  const repeatRate = repeat.u > 0 ? multi.c / repeat.u : 0;

  const orderRows = db
    .prepare(`SELECT items FROM orders WHERE status NOT IN ('cancelled', 'refunded', 'pending_payment')`)
    .all() as Array<{ items: string }>;
  const productRev = new Map<string, number>();
  const productUnits = new Map<string, number>();
  for (const o of orderRows) {
    const lines = parseJsonArray<LineSnap>(o.items, []);
    for (const line of lines) {
      const pid = line.productId;
      if (!pid) continue;
      const q = line.quantity ?? 0;
      const p = line.price ?? 0;
      productRev.set(pid, (productRev.get(pid) ?? 0) + q * p);
      productUnits.set(pid, (productUnits.get(pid) ?? 0) + q);
    }
  }
  const topByRev = [...productRev.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([productId, revenueVal]) => {
      const name =
        (db.prepare(`SELECT name FROM products WHERE id = ?`).get(productId) as { name: string } | undefined)?.name ??
        productId;
      return { productId, name, revenue: revenueVal, units: productUnits.get(productId) ?? 0 };
    });

  const activeSubs = db.prepare(`SELECT COUNT(*) as c FROM subscriptions WHERE status = 'active'`).get() as { c: number };
  const avgSub = db
    .prepare(
      `SELECT AVG(si.quantity * si.unit_price * (1 - s.discount_percent)) as m
       FROM subscription_items si JOIN subscriptions s ON s.id = si.subscription_id WHERE s.status = 'active'`
    )
    .get() as { m: number | null };
  const mrr = activeSubs.c * (avgSub.m ?? 0);

  const newCustomers = db
    .prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'customer' AND created_at >= ?`)
    .get(start30) as { c: number };

  const pointsOutstanding = db.prepare(`SELECT SUM(loyalty_points) as s FROM users`).get() as { s: number | null };

  const last30Days = Array.from({ length: 30 }).map((_, i) => {
    const dayStart = startToday - (29 - i) * day;
    const dayEnd = dayStart + day;
    const r =
      (
        db
          .prepare(
            `SELECT COALESCE(SUM(total),0) as s FROM orders WHERE created_at >= ? AND created_at < ? AND status NOT IN ('cancelled','refunded','pending_payment')`
          )
          .get(dayStart, dayEnd) as { s: number }
      ).s ?? 0;
    return { day: dayStart, revenue: r };
  });

  return NextResponse.json({
    revenue: {
      today: revenue(startToday),
      week: revenue(startWeek),
      month: revenue(startMonth),
      allTime: revenue(0),
    },
    ordersByStatus: byStatus,
    aov: { allTime: aovAll, last30Days: aov30 },
    repeatPurchaseRate: repeatRate,
    topProducts: topByRev,
    subscriptionMRR: mrr,
    newCustomersLast30: newCustomers.c,
    loyaltyPointsOutstanding: pointsOutstanding.s ?? 0,
    revenueLast30Days: last30Days,
  });
}
