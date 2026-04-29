import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { listPublicProductFilenames, mergeProductImagesWithDisk } from "@/lib/product-images-server";
import { getCanonicalProductImage } from "@/lib/product-pdp-theme";
import { parseJsonArray } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { calculateTotals, type CartItem } from "@/lib/cart";
import { calculateCryptoAmount, getCryptoOptions } from "@/lib/crypto-payment";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { appliedDiscountSchema, normalizeDiscountType, validateDiscountCodeConstraints } from "@/lib/discounts";
const lineSchema = z.object({
  productId: z.string(),
  variantId: z.string(),
  quantity: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  size: z.string(),
  price: z.number(),
  image: z.string().optional(),
  subscriptionEligible: z.boolean().optional(),
});

const schema = z.object({
  items: z.array(lineSchema),
  discountCode: z.string().trim().min(1).optional(),
  discount: z.object({ code: z.string() }).nullable().optional(),
  loyaltyPointsToRedeem: z.number().min(0).optional(),
  isSubscription: z.boolean().optional(),
  guestEmail: z.string().email().optional(),
  shippingAddress: z.record(z.string(), z.unknown()),
  cryptoSymbol: z.string().min(2),
});

class CheckoutDiscountError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = "CheckoutDiscountError";
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }
  const d = parsed.data;
  const email = user?.email ?? d.guestEmail;
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const items: CartItem[] = [];
  const variantRows = await prisma.variants.findMany({
    where: {
      id: { in: d.items.map((line) => line.variantId) },
      product_id: { in: d.items.map((line) => line.productId) },
    },
  });
  const products = await prisma.products.findMany({
    where: { id: { in: variantRows.map((v) => v.product_id) } },
    select: { id: true, name: true, slug: true, images: true, subscription_eligible: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));
  const productFiles = listPublicProductFilenames();
  const variantMap = new Map(
    variantRows.map((v) => {
      const p = productMap.get(v.product_id);
      return [`${v.id}:${v.product_id}`, p ? { ...v, product: p } : null];
    })
  );
  for (const line of d.items) {
    const v = variantMap.get(`${line.variantId}:${line.productId}`);
    if (!v || v.stock_qty < line.quantity) {
      return NextResponse.json({ error: `Stock issue: ${line.name}` }, { status: 400 });
    }
    const imgs = mergeProductImagesWithDisk(v.product.slug, parseJsonArray<string>(v.product.images, []), productFiles);
    items.push({
      productId: line.productId,
      variantId: line.variantId,
      name: v.product.name,
      slug: v.product.slug,
      size: v.size,
      price: v.price,
      image: line.image ?? getCanonicalProductImage(v.product.slug, imgs),
      quantity: line.quantity,
      subscriptionEligible: Boolean(v.product.subscription_eligible),
    });
  }

  let loyaltyRedeem = d.loyaltyPointsToRedeem ?? 0;
  if (user && loyaltyRedeem > 0) {
    const urow = await prisma.users.findFirst({
      where: { id: user.userId },
      select: { loyalty_points: true },
    });
    if (!urow || urow.loyalty_points < loyaltyRedeem) {
      return NextResponse.json({ error: "Insufficient loyalty points" }, { status: 400 });
    }
  } else if (!user) {
    loyaltyRedeem = 0;
  }

  const requestedDiscountCode = d.discountCode ?? d.discount?.code ?? null;
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  let resolvedDiscount = null;
  let resolvedDiscountId: string | null = null;
  let resolvedDiscountMaxUses: number | null = null;

  if (requestedDiscountCode) {
    const row = await prisma.discount_codes.findFirst({
      where: {
        code: { equals: requestedDiscountCode, mode: "insensitive" },
      },
    });

    if (!row) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const type = normalizeDiscountType(row.type);
    if (!type) {
      return NextResponse.json({ error: "Code type not supported" }, { status: 400 });
    }

    const discountError = validateDiscountCodeConstraints({
      subtotal,
      minOrderValue: row.min_order_value,
      maxUses: row.max_uses,
      usedCount: row.used_count,
      expiresAt: row.expires_at != null ? Number(row.expires_at) : null,
      isActive: row.is_active,
    });
    if (discountError) {
      return NextResponse.json({ error: discountError }, { status: 400 });
    }

    resolvedDiscount = appliedDiscountSchema.parse({
      code: row.code,
      type,
      value: row.value,
    });
    resolvedDiscountId = row.id;
    resolvedDiscountMaxUses = row.max_uses;
  }

  const totals = calculateTotals(items, resolvedDiscount, loyaltyRedeem, d.isSubscription ?? false);
  const options = getCryptoOptions();
  const crypto = options.find((o) => o.symbol === d.cryptoSymbol) ?? options[0];
  const cryptoAmount = await calculateCryptoAmount(totals.total, crypto.symbol);

  const orderId = nanoid();
  const snapshot = items.map((i) => ({
    ...i,
    unitPrice: i.price,
  }));
  const shippingJson = JSON.stringify(d.shippingAddress);

  try {
    await prisma.$transaction(async (tx) => {
      if (resolvedDiscountId) {
        if (resolvedDiscountMaxUses != null) {
          const consumed = await tx.discount_codes.updateMany({
            where: {
              id: resolvedDiscountId,
              is_active: 1,
              used_count: { lt: resolvedDiscountMaxUses },
            },
            data: { used_count: { increment: 1 } },
          });
          if (consumed.count !== 1) {
            throw new CheckoutDiscountError("Code no longer available", 409);
          }
        } else {
          const consumed = await tx.discount_codes.updateMany({
            where: { id: resolvedDiscountId, is_active: 1 },
            data: { used_count: { increment: 1 } },
          });
          if (consumed.count !== 1) {
            throw new CheckoutDiscountError("Code no longer available", 409);
          }
        }
      }

    await tx.orders.create({
      data: {
        id: orderId,
        user_id: user?.userId ?? null,
        guest_email: user ? null : email,
        status: "pending_payment",
        items: JSON.stringify(snapshot),
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount + totals.loyaltyDiscount,
        discount_code: totals.discountCode,
        shipping_cost: totals.shippingCost,
        tax: totals.tax,
        total: totals.total,
        shipping_address: shippingJson,
        is_subscription_order: d.isSubscription ? 1 : 0,
        loyalty_points_earned: totals.pointsToEarn,
        loyalty_points_used: loyaltyRedeem,
        crypto_currency: crypto.symbol,
        crypto_amount: cryptoAmount,
        crypto_wallet_sent_to: crypto.walletAddress,
      },
    });

    for (const line of items) {
      await tx.variants.update({
        where: { id: line.variantId },
        data: { stock_qty: { decrement: line.quantity } },
      });
      await tx.products.update({
        where: { id: line.productId },
        data: { sold_count: { increment: line.quantity } },
      });
    }

    if (user && loyaltyRedeem > 0) {
      const tid = nanoid();
      await tx.users.update({
        where: { id: user.userId },
        data: { loyalty_points: { decrement: loyaltyRedeem } },
      });
      await tx.loyalty_transactions.create({
        data: { id: tid, user_id: user.userId, points: -loyaltyRedeem, reason: "redeem_checkout", order_id: orderId },
      });
    }

    if (user) {
      const seq = nanoid();
      const ac = nanoid();
      await tx.email_sequences.create({
        data: { id: seq, user_id: user.userId, sequence_type: "post_purchase", reference_id: orderId, current_step: 0 },
      });
      await tx.abandoned_carts.create({
        data: { id: ac, user_id: user.userId, cart_data: JSON.stringify({ items: [] }), recovered: 1 },
      });
    }
    });
  } catch (error) {
    if (error instanceof CheckoutDiscountError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const displayName =
    (d.shippingAddress.fullName as string) ||
    (d.shippingAddress.name as string) ||
    email.split("@")[0];

  void sendOrderConfirmationEmail({
    id: orderId,
    email,
    name: displayName,
    items: snapshot.map((i) => ({
      name: i.name,
      size: i.size,
      quantity: i.quantity,
      unitPrice: i.price,
    })),
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount + totals.loyaltyDiscount,
    shippingCost: totals.shippingCost,
    total: totals.total,
    cryptoCurrency: crypto.symbol,
    cryptoAmount,
    cryptoWalletSentTo: crypto.walletAddress,
  });

  return NextResponse.json({
    order: {
      id: orderId,
      status: "pending_payment",
      total: totals.total,
      cryptoCurrency: crypto.symbol,
      cryptoAmount,
      walletAddress: crypto.walletAddress,
      pointsEarned: totals.pointsToEarn,
    },
  });
}
