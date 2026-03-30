import type Database from "better-sqlite3";
import getDb from "@/db/index";

export function db(): Database.Database {
  return getDb();
}

export function run(sql: string, params: unknown[] = []) {
  return db().prepare(sql).run(...params);
}

export function get<T>(sql: string, params: unknown[] = []): T | undefined {
  return db().prepare(sql).get(...params) as T | undefined;
}

export function all<T>(sql: string, params: unknown[] = []): T[] {
  return db().prepare(sql).all(...params) as T[];
}

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  password_hash: string;
  role: string;
  loyalty_points: number;
  referral_code: string;
  referred_by_id: string | null;
  email_consent: number;
  sms_consent: number;
  reset_token: string | null;
  reset_token_expires: number | null;
  last_purchase_at: number | null;
  created_at: number;
}

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  scientific_name: string | null;
  category_id: string;
  images: string;
  base_price: number;
  compare_price_at: number | null;
  sku: string;
  purity: number | null;
  molecular_formula: string | null;
  cas_number: string | null;
  storage_instructions: string | null;
  cycle_length_days: number | null;
  is_active: number;
  is_featured: number;
  is_best_seller: number;
  subscription_eligible: number;
  subscription_discount: number;
  sold_count: number;
  seo_title: string | null;
  seo_description: string | null;
  tags: string;
  created_at: number;
}

export interface VariantRow {
  id: string;
  product_id: string;
  size: string;
  price: number;
  compare_at: number | null;
  sku: string;
  stock_qty: number;
  low_stock_threshold: number;
  is_default: number;
  display_order: number;
}

export interface OrderRow {
  id: string;
  user_id: string | null;
  guest_email: string | null;
  status: string;
  items: string;
  subtotal: number;
  discount_amount: number;
  discount_code: string | null;
  shipping_cost: number;
  tax: number;
  total: number;
  shipping_address: string;
  tracking_number: string | null;
  tracking_carrier: string | null;
  tracking_url: string | null;
  is_subscription_order: number;
  loyalty_points_earned: number;
  loyalty_points_used: number;
  crypto_currency: string | null;
  crypto_amount: number | null;
  crypto_wallet_sent_to: string | null;
  crypto_tx_hash: string | null;
  admin_notes: string | null;
  created_at: number;
  confirmed_at: number | null;
  shipped_at: number | null;
  delivered_at: number | null;
}
