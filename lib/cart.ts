import { calculateDiscountAmount, type AppliedDiscount } from "@/lib/discounts";

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  size: string;
  price: number;
  image: string;
  quantity: number;
  subscriptionEligible?: boolean;
}

export interface CartTotals {
  subtotal: number;
  discountAmount: number;
  discountCode: string | null;
  shippingCost: number;
  loyaltyDiscount: number;
  tax: number;
  total: number;
  freeShippingThreshold: number;
  amountToFreeShipping: number;
  pointsToEarn: number;
}

export interface DiscountEvaluation {
  candidateName: "coupon";
  discount: AppliedDiscount;
  amount: number;
}

const FREE_SHIPPING_THRESHOLD = 0;
const SHIPPING_FLAT_RATE = 0;

function evaluateDiscountCandidates(subtotal: number, discount: AppliedDiscount | null): DiscountEvaluation[] {
  if (!discount) return [];
  return [
    {
      candidateName: "coupon",
      discount,
      amount: calculateDiscountAmount(subtotal, discount),
    },
  ];
  // Phase 2 hook: include tiered, automatic, and scheduled discount candidates.
}

export function calculateTotals(
  items: CartItem[],
  discount: AppliedDiscount | null,
  _loyaltyPointsToRedeem = 0,
  _isSubscription = false
): CartTotals {
  void _loyaltyPointsToRedeem;
  void _isSubscription;

  const subtotal = items.reduce((sum, i) => {
    return sum + i.price * i.quantity;
  }, 0);

  let discountAmount = 0;
  let discountCode: string | null = null;
  const discountCandidates = evaluateDiscountCandidates(subtotal, discount);
  if (discountCandidates.length > 0) {
    const best = discountCandidates.reduce((currentBest, candidate) => {
      return candidate.amount > currentBest.amount ? candidate : currentBest;
    }, discountCandidates[0]);
    discountAmount = best.amount;
    discountCode = best.discount.code;
  }

  const afterDiscounts = subtotal - discountAmount;
  const shippingCost = SHIPPING_FLAT_RATE;
  const tax = 0;
  const total = Math.max(0, afterDiscounts + shippingCost + tax);

  return {
    subtotal,
    discountAmount,
    discountCode,
    shippingCost,
    loyaltyDiscount: 0,
    tax,
    total,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    amountToFreeShipping: 0,
    pointsToEarn: 0,
  };
}
