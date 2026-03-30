import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import bcrypt from "bcryptjs";
import getDb from "@/db/index";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }
  const email = parsed.data.email.toLowerCase();
  const db = getDb();
  const user = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email) as { id: string } | undefined;
  if (user) {
    const raw = nanoid(48);
    const hash = bcrypt.hashSync(raw, 12);
    const exp = Math.floor(Date.now() / 1000) + 3600;
    db.prepare(`UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?`).run(hash, exp, user.id);
    void sendPasswordResetEmail(email, raw);
  }
  return NextResponse.json({ ok: true });
}
