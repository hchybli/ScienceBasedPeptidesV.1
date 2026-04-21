import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const customer = await prisma.users.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      loyalty_points: true,
      referral_code: true,
      referred_by_id: true,
      created_at: true,
      last_purchase_at: true,
    },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [orders, loyalty, referralsFrom, referredBy] = await Promise.all([
    prisma.orders.findMany({
      where: { user_id: id },
      orderBy: { created_at: "desc" },
      take: 50,
      select: { id: true, status: true, total: true, created_at: true },
    }),
    prisma.loyalty_transactions.findMany({
      where: { user_id: id },
      orderBy: { created_at: "desc" },
      take: 100,
    }),
    prisma.referrals.findMany({
      where: { referrer_id: id },
      orderBy: { created_at: "desc" },
      take: 100,
    }),
    customer.referred_by_id
      ? prisma.users.findUnique({ where: { id: customer.referred_by_id }, select: { id: true, email: true } })
      : Promise.resolve(null),
  ]);

  return NextResponse.json({
    customer: {
      ...customer,
      created_at: Number(customer.created_at),
      last_purchase_at: customer.last_purchase_at != null ? Number(customer.last_purchase_at) : null,
      referredBy,
    },
    orders: orders.map((o) => ({ ...o, created_at: Number(o.created_at) })),
    loyaltyTransactions: loyalty.map((t) => ({ ...t, created_at: Number(t.created_at) })),
    referrals: referralsFrom.map((r) => ({
      ...r,
      created_at: Number(r.created_at),
      converted_at: r.converted_at != null ? Number(r.converted_at) : null,
    })),
  });
}

