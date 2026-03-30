export type SequenceType =
  | "welcome"
  | "post_purchase"
  | "cart_abandonment"
  | "win_back"
  | "restock_reminder"
  | "subscription_renewal";

export const WELCOME_STEPS = [{ delayHours: 0 }];

export const POST_PURCHASE_STEPS = [
  { delayHours: 24 },
  { delayHours: 72 },
  { delayHours: 168 },
];

export const CART_ABANDONMENT_STEPS = [
  { delayHours: 1 },
  { delayHours: 24 },
  { delayHours: 72 },
];

export const WIN_BACK_STEPS = [
  { delayDays: 60 },
  { delayDays: 90 },
  { delayDays: 120 },
];

export const RESTOCK_REMINDER_OFFSET_DAYS = 7;

export function nextStepDueAt(
  sequenceType: SequenceType,
  step: number,
  baseTimeSec: number
): number | null {
  const now = baseTimeSec;
  if (sequenceType === "welcome") {
    return now + 3600;
  }
  if (sequenceType === "post_purchase") {
    const delays = [24, 72, 168];
    const h = delays[step];
    if (h === undefined) return null;
    return now + h * 3600;
  }
  if (sequenceType === "cart_abandonment") {
    const delays = [1, 24, 72];
    const h = delays[step];
    if (h === undefined) return null;
    return now + h * 3600;
  }
  if (sequenceType === "win_back") {
    const days = [60, 90, 120];
    const d = days[step];
    if (d === undefined) return null;
    return now + d * 86400;
  }
  if (sequenceType === "restock_reminder") {
    return now + RESTOCK_REMINDER_OFFSET_DAYS * 86400;
  }
  if (sequenceType === "subscription_renewal") {
    return now + 24 * 3600;
  }
  return null;
}
