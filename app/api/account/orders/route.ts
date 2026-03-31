import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonArray } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.orders.findMany({
    where: { user_id: user.userId },
    orderBy: { created_at: "desc" },
    take: 100,
    select: {
      id: true,
      total: true,
      status: true,
      created_at: true,
      items: true,
    },
  });

  return NextResponse.json({
    orders: orders.map((order) => ({
      id: order.id,
      total: order.total,
      status: order.status,
      created_at: Number(order.created_at),
      itemCount: parseJsonArray<Record<string, unknown>>(order.items, []).length,
    })),
  });
}
