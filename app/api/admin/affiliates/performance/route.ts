import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

type AffiliatePerformanceRow = {
  affiliate_id: string;
  affiliate_name: string | null;
  affiliate_email: string;
  referral_code: string;
  referred_users: number | string | bigint | null;
  converted_users: number | string | bigint | null;
  affiliate_clicks: number | string | bigint | null;
  qualified_referred_orders: number | string | bigint | null;
  revenue_brought_in: number | string | bigint | null;
};

function toNumber(value: number | string | bigint | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return 0;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const rows = await prisma.$queryRawUnsafe<AffiliatePerformanceRow[]>(
    `WITH affiliate_clicks AS (
       SELECT referrer_id, COUNT(*) AS affiliate_clicks
       FROM referrals
       GROUP BY referrer_id
     )
     SELECT
       a.id AS affiliate_id,
       a.name AS affiliate_name,
       a.email AS affiliate_email,
       a.referral_code,
       COUNT(DISTINCT ru.id) AS referred_users,
       COUNT(DISTINCT CASE WHEN o.id IS NOT NULL THEN ru.id END) AS converted_users,
       COALESCE(ac.affiliate_clicks, 0) AS affiliate_clicks,
       COUNT(o.id) AS qualified_referred_orders,
       COALESCE(SUM(o.total), 0) AS revenue_brought_in
     FROM users a
     LEFT JOIN users ru
       ON ru.referred_by_id = a.id
     LEFT JOIN orders o
       ON o.user_id = ru.id
      AND o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
     LEFT JOIN affiliate_clicks ac
       ON ac.referrer_id = a.id
     WHERE a.role = 'customer'
     GROUP BY a.id, a.name, a.email, a.referral_code, ac.affiliate_clicks
     ORDER BY revenue_brought_in DESC, qualified_referred_orders DESC, referred_users DESC, a.created_at ASC`
  );

  const affiliates = rows.map((row) => {
    const revenue = toNumber(row.revenue_brought_in);
    const qualifiedOrders = toNumber(row.qualified_referred_orders);
    const conversions = toNumber(row.converted_users);
    const referredUsers = toNumber(row.referred_users);

    return {
      id: row.affiliate_id,
      name: row.affiliate_name,
      email: row.affiliate_email,
      referralCode: row.referral_code,
      referredUsers,
      conversions,
      conversionRate: referredUsers > 0 ? conversions / referredUsers : 0,
      affiliateClicks: toNumber(row.affiliate_clicks),
      qualifiedReferredOrders: qualifiedOrders,
      revenueBroughtIn: revenue,
      averageOrderValue: qualifiedOrders > 0 ? revenue / qualifiedOrders : 0,
    };
  });

  return NextResponse.json({ affiliates }, { headers: PRIVATE_NO_STORE_HEADERS });
}

