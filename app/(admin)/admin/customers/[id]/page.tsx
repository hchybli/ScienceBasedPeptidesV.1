export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-2xl font-semibold">Customer {id.slice(0, 8)}</h1>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Detail view can list orders and loyalty history via dedicated admin APIs.</p>
    </div>
  );
}
