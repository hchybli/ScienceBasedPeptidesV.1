import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import getDb from "@/db/index";
import { hashPassword, setAuthCookie, signToken } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { attributeRegistration } from "@/lib/referral";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120).optional(),
  referralCode: z.string().min(4).max(32).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { email, password, name, referralCode } = parsed.data;
  const db = getDb();
  const exists = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email.toLowerCase());
  if (exists) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const id = nanoid();
  const referral_code = nanoid(10);
  const hash = hashPassword(password);
  const welcomePoints = 500;

  db.prepare(
    `INSERT INTO users (id, email, name, password_hash, role, loyalty_points, referral_code, email_consent)
     VALUES (?, ?, ?, ?, 'customer', ?, ?, 1)`
  ).run(id, email.toLowerCase(), name ?? null, hash, welcomePoints, referral_code);

  const lt = nanoid();
  db.prepare(
    `INSERT INTO loyalty_transactions (id, user_id, points, reason, order_id) VALUES (?, ?, ?, 'signup_bonus', NULL)`
  ).run(lt, id, welcomePoints);

  const seq = nanoid();
  db.prepare(
    `INSERT INTO email_sequences (id, user_id, sequence_type, current_step, completed) VALUES (?, ?, 'welcome', 0, 0)`
  ).run(seq, id);

  if (referralCode) {
    attributeRegistration(id, referralCode);
  }

  const token = signToken({ userId: id, email: email.toLowerCase(), role: "customer" });
  await setAuthCookie(token);

  void sendWelcomeEmail({
    email: email.toLowerCase(),
    name: name ?? "Researcher",
    referralCode: referral_code,
  });

  const user = {
    id,
    email: email.toLowerCase(),
    name: name ?? "",
    role: "customer" as const,
    loyaltyPoints: welcomePoints,
    referralCode: referral_code,
  };

  return NextResponse.json({ user, token });
}
