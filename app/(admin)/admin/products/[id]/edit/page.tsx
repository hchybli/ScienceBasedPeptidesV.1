export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="font-display text-2xl font-semibold">Edit product</h1>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Extend with PATCH /api/products/[slug] when you add admin update routes.</p>
    </div>
  );
}
