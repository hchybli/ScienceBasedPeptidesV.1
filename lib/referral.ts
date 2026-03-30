import { nanoid } from "nanoid";
import getDb from "@/db/index";

const REFERRAL_POINTS_ON_CONVERT = 2000;

export function createReferralClick(referrerId: string, referredEmail?: string): string {
  const db = getDb();
  const id = nanoid();
  db.prepare(
    `INSERT INTO referrals (id, referrer_id, referred_email, status) VALUES (?, ?, ?, 'clicked')`
  ).run(id, referrerId, referredEmail ?? null);
  return id;
}

export function attributeRegistration(referredUserId: string, referralCode: string): void {
  const db = getDb();
  const referrer = db
    .prepare(`SELECT id FROM users WHERE referral_code = ?`)
    .get(referralCode) as { id: string } | undefined;
  if (!referrer) return;
  db.prepare(`UPDATE users SET referred_by_id = ? WHERE id = ?`).run(referrer.id, referredUserId);
  db.prepare(
    `UPDATE referrals SET status = 'registered', referred_user_id = ? WHERE rowid = (
      SELECT rowid FROM referrals WHERE referrer_id = ? AND referred_user_id IS NULL ORDER BY created_at DESC LIMIT 1
    )`
  ).run(referredUserId, referrer.id);
}

export function markReferralConverted(referredUserId: string): void {
  const db = getDb();
  const user = db
    .prepare(`SELECT referred_by_id FROM users WHERE id = ?`)
    .get(referredUserId) as { referred_by_id: string | null } | undefined;
  if (!user?.referred_by_id) return;
  const ref = db
    .prepare(
      `SELECT id FROM referrals WHERE referred_user_id = ? AND status != 'converted' ORDER BY created_at DESC LIMIT 1`
    )
    .get(referredUserId) as { id: string } | undefined;
  if (!ref) return;
  db.prepare(
    `UPDATE referrals SET status = 'converted', converted_at = unixepoch(), points_awarded = ? WHERE id = ?`
  ).run(REFERRAL_POINTS_ON_CONVERT, ref.id);
  db.prepare(`UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?`).run(
    REFERRAL_POINTS_ON_CONVERT,
    user.referred_by_id
  );
  const tid = nanoid();
  db.prepare(
    `INSERT INTO loyalty_transactions (id, user_id, points, reason, order_id) VALUES (?, ?, ?, ?, ?)`
  ).run(tid, user.referred_by_id, REFERRAL_POINTS_ON_CONVERT, "referral_conversion", null);
}
