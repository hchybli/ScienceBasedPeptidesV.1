import { NextResponse } from "next/server";
import getDb from "@/db/index";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = getDb();
  const orders = db.prepare(`SELECT id, user_id, guest_email, status, total, created_at FROM orders ORDER BY created_at DESC LIMIT 500`).all();
  return NextResponse.json({ orders });
}
