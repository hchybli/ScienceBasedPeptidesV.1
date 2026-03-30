import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import getDb from "@/db/index";

const schema = z.object({
  email: z.string().email(),
  consent: z.boolean(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success || !parsed.data.consent) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const db = getDb();
  const id = nanoid();
  try {
    db.prepare(`INSERT INTO newsletter_signups (id, email, consent) VALUES (?, ?, 1)`).run(
      id,
      parsed.data.email.toLowerCase()
    );
  } catch {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: true });
}
