import { NextResponse } from "next/server";
import getDb from "@/db/index";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  const code = db.prepare(`SELECT referral_code FROM users WHERE id = ?`).get(user.userId) as { referral_code: string };
  const stats = db
    .prepare(
      `SELECT status, COUNT(*) as c FROM referrals WHERE referrer_id = ? GROUP BY status`
    )
    .all(user.userId) as Array<{ status: string; c: number }>;
  return NextResponse.json({ referralCode: code.referral_code, stats });
}
