import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const body = (await req.json().catch(() => null)) as null | { body?: unknown };
  const noteBody = typeof body?.body === "string" ? body.body.trim() : "";
  if (!noteBody) {
    return NextResponse.json({ error: "Note body required" }, { status: 400 });
  }

  const created = await prisma.customer_notes.create({
    data: {
      id: crypto.randomUUID(),
      user_id: id,
      body: noteBody,
      author_user_id: user.userId,
    },
    select: { id: true, body: true, author_user_id: true, created_at: true, updated_at: true },
  });

  return NextResponse.json({
    note: {
      ...created,
      created_at: Number(created.created_at),
      updated_at: created.updated_at != null ? Number(created.updated_at) : null,
    },
  });
}

