export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  size: string;
  price: number;
  image: string;
  quantity: number;
  subscriptionEligible: boolean;
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

const FREE_SHIPPING_THRESHOLD = 150;
const SHIPPING_FLAT_RATE = 9.99;
const POINTS_PER_DOLLAR = 1;

export function calculateTotals(
  items: CartItem[],
  discount: { code: string; type: string; value: number } | null,
  loyaltyPointsToRedeem: number,
  isSubscription: boolean
): CartTotals {
  const subtotal = items.reduce((sum, i) => {
    const price = isSubscription && i.subscriptionEligible ? i.price * 0.85 : i.price;
    return sum + price * i.quantity;
  }, 0);

  let discountAmount = 0;
  let discountCode: string | null = null;
  if (discount) {
    discountCode = discount.code;
    if (discount.type === "percentage") discountAmount = subtotal * (discount.value / 100);
    else if (discount.type === "fixed") discountAmount = Math.min(discount.value, subtotal);
  }

  const loyaltyDiscount = Math.min(loyaltyPointsToRedeem / 100, subtotal - discountAmount);

  const afterDiscounts = subtotal - discountAmount - loyaltyDiscount;
  const shippingCost =
    discount?.type === "free_shipping" || afterDiscounts >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  const tax = 0;
  const total = Math.max(0, afterDiscounts + shippingCost + tax);
  const pointsToEarn = Math.floor(total * POINTS_PER_DOLLAR);

  return {
    subtotal,
    discountAmount,
    discountCode,
    shippingCost,
    loyaltyDiscount,
    tax,
    total,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    amountToFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - afterDiscounts),
    pointsToEarn,
  };
}
