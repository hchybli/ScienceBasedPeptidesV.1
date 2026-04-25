import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function nowEpochSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string; noteId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, noteId } = await ctx.params;

  const body = (await req.json().catch(() => null)) as null | { body?: unknown };
  const noteBody = typeof body?.body === "string" ? body.body.trim() : "";
  if (!noteBody) {
    return NextResponse.json({ error: "Note body required" }, { status: 400 });
  }

  const updatedAt = BigInt(nowEpochSeconds());
  const updated = await prisma.customer_notes.updateMany({
    where: { id: noteId, user_id: id },
    data: { body: noteBody, updated_at: updatedAt },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const note = await prisma.customer_notes.findFirst({
    where: { id: noteId, user_id: id },
    select: { id: true, body: true, author_user_id: true, created_at: true, updated_at: true },
  });

  return NextResponse.json({
    note: note
      ? {
          ...note,
          created_at: Number(note.created_at),
          updated_at: note.updated_at != null ? Number(note.updated_at) : null,
        }
      : null,
  });
}

