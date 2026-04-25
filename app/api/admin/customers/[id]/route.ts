import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function nowEpochSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

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
      phone: true,
      role: true,
      loyalty_points: true,
      referral_code: true,
      referred_by_id: true,
      created_at: true,
      last_purchase_at: true,
    },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [orders, loyalty, referralsFrom, referredBy, addresses, tags, statusRow, notes] = await Promise.all([
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
    prisma.addresses.findMany({
      where: { user_id: id },
      orderBy: [{ is_default: "desc" }, { created_at: "desc" }],
      take: 10,
    }),
    prisma.customer_tags.findMany({
      where: { user_id: id },
      orderBy: { created_at: "desc" },
      select: { id: true, tag: true, created_at: true },
    }),
    prisma.customer_status.findUnique({
      where: { user_id: id },
      select: { status: true, updated_at: true, updated_by: true },
    }),
    prisma.customer_notes.findMany({
      where: { user_id: id },
      orderBy: [{ updated_at: "desc" }, { created_at: "desc" }],
      take: 50,
      select: { id: true, body: true, author_user_id: true, created_at: true, updated_at: true },
    }),
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
    addresses: addresses.map((a) => ({ ...a, created_at: Number(a.created_at) })),
    tags: tags.map((t) => ({ ...t, created_at: Number(t.created_at) })),
    status: statusRow
      ? {
          status: statusRow.status,
          updated_at: Number(statusRow.updated_at),
          updated_by: statusRow.updated_by ?? null,
        }
      : { status: "active", updated_at: null, updated_by: null },
    notes: notes.map((n) => ({
      ...n,
      created_at: Number(n.created_at),
      updated_at: n.updated_at != null ? Number(n.updated_at) : null,
    })),
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const body = (await req.json().catch(() => null)) as null | { status?: unknown };
  const status = typeof body?.status === "string" ? body.status : "";
  if (status !== "active" && status !== "suspended") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const epoch = nowEpochSeconds();
  const next = await prisma.customer_status.upsert({
    where: { user_id: id },
    update: { status, updated_at: BigInt(epoch), updated_by: user.userId },
    create: { id: crypto.randomUUID(), user_id: id, status, updated_at: BigInt(epoch), updated_by: user.userId },
    select: { user_id: true, status: true, updated_at: true, updated_by: true },
  });

  return NextResponse.json({
    status: {
      status: next.status,
      updated_at: Number(next.updated_at),
      updated_by: next.updated_by ?? null,
    },
  });
}

