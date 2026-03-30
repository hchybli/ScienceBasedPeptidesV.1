import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import getDb from "@/db/index";
import { hashPassword } from "@/lib/auth";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { token, password } = parsed.data;
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const users = db.prepare(`SELECT id, reset_token, reset_token_expires FROM users WHERE reset_token IS NOT NULL`).all() as Array<{
    id: string;
    reset_token: string;
    reset_token_expires: number;
  }>;

  let match: string | null = null;
  for (const u of users) {
    if (u.reset_token_expires < now) continue;
    if (bcrypt.compareSync(token, u.reset_token)) {
      match = u.id;
      break;
    }
  }
  if (!match) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  db.prepare(`UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?`).run(
    hashPassword(password),
    match
  );
  return NextResponse.json({ ok: true });
}
