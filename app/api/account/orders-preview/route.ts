import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }
  const orders = await prisma.orders.findMany({
    where: { user_id: user.userId },
    orderBy: { created_at: "desc" },
    take: 10,
    select: { id: true, total: true, status: true, created_at: true },
  });
  return NextResponse.json({ orders }, { headers: PRIVATE_NO_STORE_HEADERS });
}
