import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonArray } from "@/lib/utils";

const patchSchema = z
  .object({
    status: z.enum(["pending_payment", "awaiting_confirmation", "confirmed", "processing", "shipped", "delivered"]).optional(),
    tracking_number: z.string().min(1).optional(),
    tracking_carrier: z.string().min(1).optional(),
    tracking_url: z.string().url().nullable().optional(),
    admin_notes: z.string().max(5000).nullable().optional(),
  })
  .strict();

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const order = await prisma.orders.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const customer = order.user_id
    ? await prisma.users.findUnique({ where: { id: order.user_id }, select: { id: true, email: true, name: true } })
    : null;

  return NextResponse.json({
    order: {
      ...order,
      created_at: Number(order.created_at),
      confirmed_at: order.confirmed_at != null ? Number(order.confirmed_at) : null,
      shipped_at: order.shipped_at != null ? Number(order.shipped_at) : null,
      delivered_at: order.delivered_at != null ? Number(order.delivered_at) : null,
      items: parseJsonArray(order.items, []),
      shipping_address: (() => {
        try {
          return JSON.parse(order.shipping_address || "{}");
        } catch {
          return {};
        }
      })(),
      customer,
    },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const existing = await prisma.orders.findUnique({ where: { id }, select: { status: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = Math.floor(Date.now() / 1000);
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status && parsed.data.status !== existing.status) {
    if (parsed.data.status === "confirmed") data.confirmed_at = now;
    if (parsed.data.status === "shipped") data.shipped_at = now;
    if (parsed.data.status === "delivered") data.delivered_at = now;
  }

  const updated = await prisma.orders.update({ where: { id }, data });
  return NextResponse.json({
    ok: true,
    order: {
      ...updated,
      created_at: Number(updated.created_at),
      confirmed_at: updated.confirmed_at != null ? Number(updated.confirmed_at) : null,
      shipped_at: updated.shipped_at != null ? Number(updated.shipped_at) : null,
      delivered_at: updated.delivered_at != null ? Number(updated.delivered_at) : null,
    },
  });
}

