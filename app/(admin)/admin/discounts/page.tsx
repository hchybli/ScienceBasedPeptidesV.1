import getDb from "@/db/index";

export default function AdminDiscountsPage() {
  const db = getDb();
  const codes = db.prepare(`SELECT * FROM discount_codes ORDER BY code`).all();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Discount codes</h1>
      <pre className="mt-8 overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-surface p-4 text-xs">
        {JSON.stringify(codes, null, 2)}
      </pre>
    </div>
  );
}
