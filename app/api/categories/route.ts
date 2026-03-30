import { NextResponse } from "next/server";
import getDb from "@/db/index";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(`SELECT id, name, slug, description, display_order FROM categories ORDER BY display_order ASC`)
    .all();
  return NextResponse.json({ categories: rows });
}
