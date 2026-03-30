import { NextResponse } from "next/server";
import { z } from "zod";
import getDb from "@/db/index";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonArray } from "@/lib/utils";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  const db = getDb();
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isOwner = user?.userId && order.user_id === user.userId;
  const isAdmin = user?.role === "admin";
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    order: {
      ...order,
      items: parseJsonArray(order.items as string, []),
      shippingAddress: JSON.parse((order.shipping_address as string) || "{}"),
    },
  });
}

const patchBody = z.object({
  cryptoTxHash: z.string().min(8).max(256).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = patchBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const db = getDb();
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id) as { user_id: string | null } | undefined;
  if (!order || order.user_id !== user.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (parsed.data.cryptoTxHash) {
    db.prepare(`UPDATE orders SET crypto_tx_hash = ?, status = 'awaiting_confirmation' WHERE id = ?`).run(
      parsed.data.cryptoTxHash,
      id
    );
  }
  return NextResponse.json({ ok: true });
}
