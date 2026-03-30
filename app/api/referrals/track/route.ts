import { NextResponse } from "next/server";
import { z } from "zod";
import getDb from "@/db/index";
import { createReferralClick } from "@/lib/referral";

const schema = z.object({
  code: z.string().min(4),
  email: z.string().email().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const db = getDb();
  const ref = db.prepare(`SELECT id FROM users WHERE referral_code = ?`).get(parsed.data.code) as { id: string } | undefined;
  if (!ref) {
    return NextResponse.json({ ok: true });
  }
  createReferralClick(ref.id, parsed.data.email);
  return NextResponse.json({ ok: true });
}
