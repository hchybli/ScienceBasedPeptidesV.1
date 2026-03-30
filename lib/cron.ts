import { nanoid } from "nanoid";
import getDb from "@/db/index";
import {
  sendCartAbandonmentEmail,
  sendLowStockAlertEmail,
  sendRestockReminderEmail,
  sendWinBackEmail,
} from "@/lib/email";
export function processEmailSequences(): { sent: number } {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const rows = db
    .prepare(
      `SELECT * FROM email_sequences WHERE completed = 0 AND (last_sent_at IS NULL OR last_sent_at < ?)`
    )
    .all(now - 3600) as Array<{
      id: string;
      user_id: string;
      sequence_type: string;
      reference_id: string | null;
      current_step: number;
      last_sent_at: number | null;
    }>;

  let sent = 0;
  for (const seq of rows) {
    const user = db.prepare(`SELECT email, name FROM users WHERE id = ?`).get(seq.user_id) as
      | { email: string; name: string | null }
      | undefined;
    if (!user) continue;
    if (seq.sequence_type === "cart_abandonment") {
      const cart = db
        .prepare(`SELECT cart_data FROM abandoned_carts WHERE user_id = ? ORDER BY last_updated DESC LIMIT 1`)
        .get(seq.user_id) as { cart_data: string } | undefined;
      if (!cart) continue;
      const data = JSON.parse(cart.cart_data) as {
        items: Array<{ name: string; size: string; quantity: number; price: number }>;
      };
      void sendCartAbandonmentEmail(seq.current_step, {
        email: user.email,
        name: user.name ?? "",
        cartItems: data.items.map((i) => ({
          name: i.name,
          size: i.size,
          quantity: i.quantity,
          price: i.price,
        })),
        discountCode: "CART10",
      });
      db.prepare(
        `UPDATE email_sequences SET current_step = current_step + 1, last_sent_at = ? WHERE id = ?`
      ).run(now, seq.id);
      sent++;
    }
    if (seq.sequence_type === "win_back") {
      void sendWinBackEmail(seq.current_step, {
        email: user.email,
        name: user.name ?? "",
        discountCode: "WINBACK15",
      });
      db.prepare(
        `UPDATE email_sequences SET current_step = current_step + 1, last_sent_at = ? WHERE id = ?`
      ).run(now, seq.id);
      sent++;
    }
    if (seq.sequence_type === "restock_reminder" && seq.reference_id) {
      const p = db
        .prepare(`SELECT name, slug, cycle_length_days FROM products WHERE id = ?`)
        .get(seq.reference_id) as
        | { name: string; slug: string; cycle_length_days: number | null }
        | undefined;
      if (!p) continue;
      void sendRestockReminderEmail({
        email: user.email,
        name: user.name ?? "",
        productName: p.name,
        productSlug: p.slug,
        daysLeft: Math.max(1, (p.cycle_length_days ?? 30) - 7),
      });
      db.prepare(`UPDATE email_sequences SET completed = 1, last_sent_at = ? WHERE id = ?`).run(now, seq.id);
      sent++;
    }
  }
  return { sent };
}

export function expireInactiveLoyalty(): { expiredUsers: number } {
  const db = getDb();
  const yearAgo = Math.floor(Date.now() / 1000) - 365 * 86400;
  const users = db
    .prepare(
      `SELECT id, loyalty_points FROM users WHERE loyalty_points > 0 AND (last_purchase_at IS NULL OR last_purchase_at < ?)`
    )
    .all(yearAgo) as Array<{ id: string; loyalty_points: number }>;

  let expiredUsers = 0;
  for (const u of users) {
    const pts = u.loyalty_points;
    if (pts <= 0) continue;
    db.prepare(`UPDATE users SET loyalty_points = 0 WHERE id = ?`).run(u.id);
    const tid = nanoid();
    db.prepare(
      `INSERT INTO loyalty_transactions (id, user_id, points, reason, order_id) VALUES (?, ?, ?, ?, ?)`
    ).run(tid, u.id, -pts, "inactivity_expiry", null);
    expiredUsers++;
  }
  return { expiredUsers };
}

export function alertLowStock(adminEmail: string | undefined): { lines: string[] } {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT v.sku, v.stock_qty, v.low_stock_threshold, p.name FROM variants v JOIN products p ON p.id = v.product_id WHERE v.stock_qty < v.low_stock_threshold`
    )
    .all() as Array<{ sku: string; stock_qty: number; low_stock_threshold: number; name: string }>;

  const lines = rows.map((r) => `${r.name} (${r.sku}): ${r.stock_qty} left (threshold ${r.low_stock_threshold})`);
  if (lines.length && adminEmail) {
    void sendLowStockAlertEmail(adminEmail, lines);
  }
  return { lines };
}

export function createSubscriptionOrdersDue(): { created: number } {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const subs = db
    .prepare(
      `SELECT * FROM subscriptions WHERE status = 'active' AND next_billing_date <= ? AND (paused_until IS NULL OR paused_until <= ?)`
    )
    .all(now, now) as Array<{
      id: string;
      user_id: string;
      interval_days: number;
      discount_percent: number;
    }>;

  let created = 0;
  for (const s of subs) {
    const items = db
      .prepare(`SELECT * FROM subscription_items WHERE subscription_id = ?`)
      .all(s.id) as Array<{
        product_id: string;
        variant_id: string;
        quantity: number;
        unit_price: number;
      }>;
    if (!items.length) continue;
    const orderId = nanoid();
    const lineItems = [];
    let subtotal = 0;
    for (const it of items) {
      const price = it.unit_price * (1 - s.discount_percent);
      subtotal += price * it.quantity;
      const p = db.prepare(`SELECT name, slug FROM products WHERE id = ?`).get(it.product_id) as {
        name: string;
        slug: string;
      };
      const v = db.prepare(`SELECT size FROM variants WHERE id = ?`).get(it.variant_id) as { size: string };
      lineItems.push({
        productId: it.product_id,
        variantId: it.variant_id,
        name: p.name,
        slug: p.slug,
        size: v.size,
        quantity: it.quantity,
        unitPrice: price,
      });
    }
    const shipping = subtotal >= 150 ? 0 : 9.99;
    const total = subtotal + shipping;
    const user = db.prepare(`SELECT email FROM users WHERE id = ?`).get(s.user_id) as { email: string };
    db.prepare(
      `INSERT INTO orders (id, user_id, guest_email, status, items, subtotal, discount_amount, total, shipping_address, is_subscription_order, loyalty_points_earned, loyalty_points_used)
       VALUES (?, ?, ?, 'pending_payment', ?, ?, 0, ?, ?, 1, 0, 0)`
    ).run(
      orderId,
      s.user_id,
      user.email,
      JSON.stringify(lineItems),
      subtotal,
      total,
      JSON.stringify({ label: "subscription" })
    );
    db.prepare(`UPDATE subscriptions SET next_billing_date = next_billing_date + ? * 86400 WHERE id = ?`).run(
      s.interval_days,
      s.id
    );
    created++;
  }
  return { created };
}

export function startAbandonmentForStaleCarts(): { started: number } {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const stale = db
    .prepare(
      `SELECT * FROM abandoned_carts WHERE recovered = 0 AND last_updated < ? AND email_step = 0`
    )
    .all(now - 3600) as Array<{ id: string; user_id: string | null }>;

  let started = 0;
  for (const c of stale) {
    if (!c.user_id) continue;
    const exists = db
      .prepare(`SELECT id FROM email_sequences WHERE user_id = ? AND sequence_type = 'cart_abandonment' AND completed = 0`)
      .get(c.user_id);
    if (exists) continue;
    const sid = nanoid();
    db.prepare(
      `INSERT INTO email_sequences (id, user_id, sequence_type, reference_id, current_step, last_sent_at, completed) VALUES (?, ?, 'cart_abandonment', ?, 0, NULL, 0)`
    ).run(sid, c.user_id, c.id);
    started++;
  }
  return { started };
}

export function scheduleWinBackForInactiveUsers(): { scheduled: number } {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const thresholds = [60, 90, 120];
  let scheduled = 0;
  for (let i = 0; i < thresholds.length; i++) {
    const days = thresholds[i];
    const since = now - days * 86400;
    const users = db
      .prepare(
        `SELECT u.id FROM users u WHERE u.role = 'customer' AND (u.last_purchase_at IS NULL OR u.last_purchase_at < ?) AND u.email_consent = 1`
      )
      .all(since) as Array<{ id: string }>;

    for (const u of users) {
      const dup = db
        .prepare(
          `SELECT id FROM email_sequences WHERE user_id = ? AND sequence_type = 'win_back' AND completed = 0`
        )
        .get(u.id);
      if (dup) continue;
      const sid = nanoid();
      db.prepare(
        `INSERT INTO email_sequences (id, user_id, sequence_type, current_step, last_sent_at, completed) VALUES (?, ?, 'win_back', ?, NULL, 0)`
      ).run(sid, u.id, i);
      scheduled++;
    }
  }
  return { scheduled };
}
