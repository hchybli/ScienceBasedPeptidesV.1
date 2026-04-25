import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const body = (await req.json().catch(() => null)) as null | { tags?: unknown };
  const rawTags = Array.isArray(body?.tags) ? body?.tags : null;
  if (!rawTags) {
    return NextResponse.json({ error: "Invalid tags" }, { status: 400 });
  }

  const tags = Array.from(
    new Set(
      rawTags
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter(Boolean)
        .map((t) => t.toLowerCase())
    )
  ).slice(0, 50);

  await prisma.$transaction(async (tx) => {
    await tx.customer_tags.deleteMany({ where: { user_id: id } });
    if (tags.length > 0) {
      await tx.customer_tags.createMany({
        data: tags.map((tag) => ({ id: crypto.randomUUID(), user_id: id, tag })),
        skipDuplicates: true,
      });
    }
  });

  const updated = await prisma.customer_tags.findMany({
    where: { user_id: id },
    orderBy: { created_at: "desc" },
    select: { id: true, tag: true, created_at: true },
  });

  return NextResponse.json({
    tags: updated.map((t) => ({ ...t, created_at: Number(t.created_at) })),
  });
}

