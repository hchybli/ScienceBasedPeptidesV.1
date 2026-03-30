import { NextResponse } from "next/server";
import getDb from "@/db/index";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  const u = db.prepare(`SELECT loyalty_points FROM users WHERE id = ?`).get(user.userId) as { loyalty_points: number };
  const history = db
    .prepare(`SELECT * FROM loyalty_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 200`)
    .all(user.userId);
  return NextResponse.json({ balance: u.loyalty_points, history });
}
