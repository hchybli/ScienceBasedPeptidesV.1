import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

const schema = z.object({
  type: z.enum(["welcome"]),
  email: z.string().email(),
  name: z.string(),
  referralCode: z.string(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  if (parsed.data.type === "welcome") {
    await sendWelcomeEmail({
      email: parsed.data.email,
      name: parsed.data.name,
      referralCode: parsed.data.referralCode,
    });
  }
  return NextResponse.json({ ok: true });
}
