import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const status = (searchParams.get("status") ?? "pending").toLowerCase();
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const whereApproved =
    status === "approved" ? "AND r.is_approved = 1" : status === "all" ? "" : "AND r.is_approved = 0";

  const rows = (await prisma.$queryRawUnsafe(
    `SELECT r.*, u.name AS user_name, u.email AS user_email
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.product_id = $1 ${whereApproved}
     ORDER BY r.created_at DESC LIMIT 200`,
    productId
  )) as Array<Record<string, unknown>>;

  return NextResponse.json({
    reviews: rows.map((r) => ({
      id: r.id as string,
      productId: r.product_id as string,
      userId: r.user_id as string,
      rating: r.rating as number,
      title: (r.title as string | null) ?? null,
      body: r.body as string,
      isVerified: Boolean(r.is_verified),
      isApproved: Boolean(r.is_approved),
      createdAt: Number(r.created_at),
      userName: (r.user_name as string | null) ?? null,
      userEmail: (r.user_email as string | null) ?? null,
    })),
  });
}

