import { nanoid } from "nanoid";
import getDb from "@/db/index";

export function awardPointsForOrder(params: {
  userId: string;
  orderId: string;
  orderTotalUsd: number;
  isSubscription: boolean;
}): number {
  const db = getDb();
  const base = Math.floor(params.orderTotalUsd);
  const points = params.isSubscription ? base * 2 : base;
  const uid = nanoid();
  db.prepare(
    `UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?`
  ).run(points, params.userId);
  db.prepare(
    `INSERT INTO loyalty_transactions (id, user_id, points, reason, order_id) VALUES (?, ?, ?, ?, ?)`
  ).run(uid, params.userId, points, "order_earned", params.orderId);
  return points;
}

export function redeemPoints(userId: string, points: number, reason: string): void {
  const db = getDb();
  const uid = nanoid();
  db.prepare(`UPDATE users SET loyalty_points = loyalty_points - ? WHERE id = ?`).run(points, userId);
  db.prepare(
    `INSERT INTO loyalty_transactions (id, user_id, points, reason, order_id) VALUES (?, ?, ?, ?, ?)`
  ).run(uid, userId, -points, reason, null);
}

export function minimumRedeemPoints(): number {
  return 500;
}

export function pointsToUsd(points: number): number {
  return points / 100;
}
