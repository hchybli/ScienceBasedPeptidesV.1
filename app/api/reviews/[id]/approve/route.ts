import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import getDb from "@/db/index";
import { getCurrentUser } from "@/lib/auth";

const REVIEW_POINTS = 1000;

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const db = getDb();
  const r = db.prepare(`SELECT * FROM reviews WHERE id = ?`).get(id) as { user_id: string } | undefined;
  if (!r) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  db.prepare(`UPDATE reviews SET is_approved = 1, is_verified = 1 WHERE id = ?`).run(id);
  db.prepare(`UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?`).run(REVIEW_POINTS, r.user_id);
  const tid = nanoid();
  db.prepare(
    `INSERT INTO loyalty_transactions (id, user_id, points, reason, order_id) VALUES (?, ?, ?, 'review_approved', NULL)`
  ).run(tid, r.user_id, REVIEW_POINTS);
  return NextResponse.json({ ok: true });
}
