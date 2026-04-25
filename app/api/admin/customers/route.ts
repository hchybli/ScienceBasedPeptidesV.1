import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function parseNumber(value: string | null): number | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function parseTags(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const tagsFilter = parseTags(url.searchParams.get("tags"));
  const minSpend = parseNumber(url.searchParams.get("minSpend"));
  const maxSpend = parseNumber(url.searchParams.get("maxSpend"));
  const minOrders = parseNumber(url.searchParams.get("minOrders"));
  const maxOrders = parseNumber(url.searchParams.get("maxOrders"));

  const customers = await prisma.users.findMany({
    where: {
      role: "customer",
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { id: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      created_at: true,
    },
    take: 1000,
  });

  const userIds = customers.map((c) => c.id);
  if (userIds.length === 0) {
    return NextResponse.json({ customers: [] });
  }

  const [orderAgg, tagsRows, statusRows] = await Promise.all([
    prisma.orders.groupBy({
      by: ["user_id"],
      where: { user_id: { in: userIds } },
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.customer_tags.findMany({
      where: { user_id: { in: userIds } },
      select: { user_id: true, tag: true },
    }),
    prisma.customer_status.findMany({
      where: { user_id: { in: userIds } },
      select: { user_id: true, status: true },
    }),
  ]);

  const orderByUser = new Map<string, { orderCount: number; totalSpend: number }>();
  for (const row of orderAgg) {
    const uid = row.user_id;
    if (!uid) continue;
    orderByUser.set(uid, {
      orderCount: row._count._all,
      totalSpend: row._sum.total ?? 0,
    });
  }

  const tagsByUser = new Map<string, string[]>();
  for (const r of tagsRows) {
    const list = tagsByUser.get(r.user_id) ?? [];
    list.push(r.tag);
    tagsByUser.set(r.user_id, list);
  }

  const statusByUser = new Map<string, string>();
  for (const r of statusRows) {
    statusByUser.set(r.user_id, r.status);
  }

  const filtered = customers.filter((c) => {
    const metrics = orderByUser.get(c.id) ?? { orderCount: 0, totalSpend: 0 };
    const tags = tagsByUser.get(c.id) ?? [];

    if (tagsFilter.length > 0) {
      const tagSet = new Set(tags.map((t) => t.toLowerCase()));
      const matchesAny = tagsFilter.some((t) => tagSet.has(t.toLowerCase()));
      if (!matchesAny) return false;
    }

    if (minSpend != null && metrics.totalSpend < minSpend) return false;
    if (maxSpend != null && metrics.totalSpend > maxSpend) return false;
    if (minOrders != null && metrics.orderCount < minOrders) return false;
    if (maxOrders != null && metrics.orderCount > maxOrders) return false;

    return true;
  });

  return NextResponse.json({
    customers: filtered.map((c) => {
      const metrics = orderByUser.get(c.id) ?? { orderCount: 0, totalSpend: 0 };
      return {
        id: c.id,
        email: c.email,
        name: c.name,
        created_at: Number(c.created_at),
        order_count: metrics.orderCount,
        total_spend: metrics.totalSpend,
        tags: tagsByUser.get(c.id) ?? [],
        status: statusByUser.get(c.id) ?? "active",
      };
    }),
  });
}
