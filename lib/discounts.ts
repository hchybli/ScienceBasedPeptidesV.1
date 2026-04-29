import { z } from "zod";

export const SUPPORTED_DISCOUNT_TYPES = ["percentage", "fixed"] as const;

export const discountTypeSchema = z.enum(SUPPORTED_DISCOUNT_TYPES);
export type DiscountType = z.infer<typeof discountTypeSchema>;

export const appliedDiscountSchema = z
  .object({
    code: z.string().trim().min(1),
    type: discountTypeSchema,
    value: z.number().nonnegative(),
  })
  .strict();

export type AppliedDiscount = z.infer<typeof appliedDiscountSchema>;

export type DiscountCodeValidationInput = {
  subtotal: number;
  minOrderValue: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: number | null;
  isActive: number;
};

export function normalizeDiscountType(value: string): DiscountType | null {
  const parsed = discountTypeSchema.safeParse(value.trim().toLowerCase());
  return parsed.success ? parsed.data : null;
}

export function calculateDiscountAmount(subtotal: number, discount: AppliedDiscount): number {
  if (discount.type === "percentage") return subtotal * (discount.value / 100);
  return Math.min(discount.value, subtotal);
}

export function validateDiscountCodeConstraints(input: DiscountCodeValidationInput): string | null {
  if (input.isActive !== 1) return "Code is inactive";

  const now = Math.floor(Date.now() / 1000);
  if (input.expiresAt != null && input.expiresAt < now) return "Code expired";

  if (input.maxUses != null && input.usedCount >= input.maxUses) return "Code no longer available";

  if (input.minOrderValue != null && input.subtotal < input.minOrderValue) {
    return `Minimum order $${input.minOrderValue}`;
  }

  return null;
}

