import { NextResponse } from "next/server";
import getDb from "@/db/index";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.loyalty_points, u.created_at,
        (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count
       FROM users u WHERE u.role = 'customer' ORDER BY u.created_at DESC`
    )
    .all();
  return NextResponse.json({ customers: rows });
}
