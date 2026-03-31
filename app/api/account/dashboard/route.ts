import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const codeSuffix = customAlphabet(CODE_ALPHABET, 6);

async function ensureReferralCode(userId: string, existingCode: string | null): Promise<string> {
  if (existingCode && existingCode.trim().length > 0) return existingCode;

  for (let attempt = 0; attempt < 16; attempt += 1) {
    const candidate = `SBP-${codeSuffix()}`;
    try {
      await prisma.users.update({
        where: { id: userId },
        data: { referral_code: candidate },
      });
      return candidate;
    } catch (error) {
      const message = String(error).toLowerCase();
      if (message.includes("unique") || message.includes("referral_code")) continue;
      throw error;
    }
  }

  throw new Error("Could not generate unique referral code");
}

export async function GET() {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.users.findFirst({
    where: { id: auth.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
      referral_code: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const referralCode = await ensureReferralCode(user.id, user.referral_code);

  const [orders, clicks, conversions, referrals] = await Promise.all([
    prisma.orders.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
      take: 8,
      select: { id: true, status: true, total: true, created_at: true },
    }),
    prisma.referrals.count({ where: { referrer_id: user.id } }),
    prisma.referrals.count({ where: { referrer_id: user.id, status: "converted" } }),
    prisma.referrals.findMany({
      where: { referrer_id: user.id, referred_user_id: { not: null } },
      select: { referred_user_id: true },
    }),
  ]);

  const referredUserIds = Array.from(
    new Set(
      referrals
        .map((row) => row.referred_user_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const referredOrders =
    referredUserIds.length > 0
      ? await prisma.orders.count({
          where: { user_id: { in: referredUserIds } },
        })
      : 0;

  return NextResponse.json({
    account: {
      id: user.id,
      name: user.name ?? "",
      email: user.email,
      role: user.role,
      createdAt: Number(user.created_at),
      status: "Active",
      referralCode,
    },
    orders: orders.map((o) => ({
      ...o,
      created_at: Number(o.created_at),
    })),
    referralPerformance: {
      totalReferrals: clicks,
      clicks,
      conversions,
      referredOrders,
      estimatedCommissions: 0,
    },
  });
}
