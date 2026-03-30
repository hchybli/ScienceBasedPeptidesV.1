import { NextResponse } from "next/server";
import { z } from "zod";
import getDb from "@/db/index";
import type { CartItem } from "@/lib/cart";
import { calculateTotals } from "@/lib/cart";

const schema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string(),
      quantity: z.number().int().positive(),
    })
  ),
  discount: z
    .object({
      code: z.string(),
      type: z.string(),
      value: z.number(),
    })
    .nullable()
    .optional(),
  loyaltyPointsToRedeem: z.number().min(0).optional(),
  isSubscription: z.boolean().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart", details: parsed.error.flatten() }, { status: 400 });
  }
  const { items, discount, loyaltyPointsToRedeem = 0, isSubscription = false } = parsed.data;
  const db = getDb();
  const enriched: CartItem[] = [];
  const issues: string[] = [];

  for (const line of items) {
    const v = db
      .prepare(
        `SELECT v.*, p.name, p.slug, p.images, p.subscription_eligible FROM variants v JOIN products p ON p.id = v.product_id WHERE v.id = ? AND p.id = ?`
      )
      .get(line.variantId, line.productId) as
      | {
          id: string;
          stock_qty: number;
          price: number;
          size: string;
          name: string;
          slug: string;
          images: string;
          subscription_eligible: number;
        }
      | undefined;
    if (!v) {
      issues.push(`Invalid line: ${line.variantId}`);
      continue;
    }
    if (v.stock_qty < line.quantity) {
      issues.push(`Insufficient stock for ${v.name} (${v.size})`);
    }
    let imgs: string[] = [];
    try {
      imgs = JSON.parse(v.images) as string[];
    } catch {
      imgs = [];
    }
    enriched.push({
      productId: line.productId,
      variantId: line.variantId,
      name: v.name,
      slug: v.slug,
      size: v.size,
      price: v.price,
      image: imgs[0] ?? "/placeholder-peptide.svg",
      quantity: line.quantity,
      subscriptionEligible: Boolean(v.subscription_eligible),
    });
  }

  if (issues.length) {
    return NextResponse.json({ ok: false, issues, items: enriched }, { status: 400 });
  }

  const totals = calculateTotals(enriched, discount ?? null, loyaltyPointsToRedeem, isSubscription);
  return NextResponse.json({ ok: true, items: enriched, totals });
}
