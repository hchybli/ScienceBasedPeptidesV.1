import { NextResponse } from "next/server";
import getDb from "@/db/index";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const jwt = await getCurrentUser();
  if (!jwt) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  const row = db.prepare(`SELECT id, email, name, role, loyalty_points, referral_code FROM users WHERE id = ?`).get(
    jwt.userId
  ) as
    | {
        id: string;
        email: string;
        name: string | null;
        role: string;
        loyalty_points: number;
        referral_code: string;
      }
    | undefined;
  if (!row) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: row.id,
      email: row.email,
      name: row.name ?? "",
      role: row.role === "admin" ? "admin" : "customer",
      loyaltyPoints: row.loyalty_points,
      referralCode: row.referral_code,
    },
  });
}
