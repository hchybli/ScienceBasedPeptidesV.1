import test from "node:test";
import assert from "node:assert/strict";
import { calculateDiscountAmount, validateDiscountCodeConstraints } from "@/lib/discounts";

test("calculate percentage discount amount", () => {
  const amount = calculateDiscountAmount(200, { code: "WELCOME10", type: "percentage", value: 10 });
  assert.equal(amount, 20);
});

test("calculate fixed discount amount capped by subtotal", () => {
  const amount = calculateDiscountAmount(25, { code: "TAKE50", type: "fixed", value: 50 });
  assert.equal(amount, 25);
});

test("validate minimum order requirement", () => {
  const error = validateDiscountCodeConstraints({
    subtotal: 49,
    minOrderValue: 50,
    maxUses: null,
    usedCount: 0,
    expiresAt: null,
    isActive: 1,
  });
  assert.equal(error, "Minimum order $50");
});

test("validate usage cap reached", () => {
  const error = validateDiscountCodeConstraints({
    subtotal: 100,
    minOrderValue: null,
    maxUses: 5,
    usedCount: 5,
    expiresAt: null,
    isActive: 1,
  });
  assert.equal(error, "Code no longer available");
});

test("validate expired code", () => {
  const now = Math.floor(Date.now() / 1000);
  const error = validateDiscountCodeConstraints({
    subtotal: 100,
    minOrderValue: null,
    maxUses: null,
    usedCount: 0,
    expiresAt: now - 10,
    isActive: 1,
  });
  assert.equal(error, "Code expired");
});

