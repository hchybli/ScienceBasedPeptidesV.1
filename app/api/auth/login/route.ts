import { NextResponse } from "next/server";
import { z } from "zod";
import getDb from "@/db/index";
import { comparePassword, setAuthCookie, signToken } from "@/lib/auth";
import type { UserRow } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }
  const { email, password } = parsed.data;
  const db = getDb();
  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase()) as UserRow | undefined;
  if (!user || !comparePassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const role = user.role === "admin" ? "admin" : "customer";
  const token = signToken({ userId: user.id, email: user.email, role });
  await setAuthCookie(token);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? "",
      role,
      loyaltyPoints: user.loyalty_points,
      referralCode: user.referral_code,
    },
  });
}
