import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearAuthCookie, getCurrentUser } from "@/lib/auth";

export async function GET() {
  const jwt = await getCurrentUser();
  if (!jwt) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const row = await prisma.users.findFirst({
    where: { id: jwt.userId },
    select: { id: true, email: true, name: true, role: true, loyalty_points: true, referral_code: true },
  });
  if (!row) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await prisma.customer_status.findUnique({ where: { user_id: row.id }, select: { status: true } });
  if (status?.status === "suspended") {
    await clearAuthCookie();
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
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
