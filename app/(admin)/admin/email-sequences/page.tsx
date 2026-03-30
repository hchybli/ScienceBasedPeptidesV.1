export default function AdminEmailSequencesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Email sequences</h1>
      <p className="mt-4 text-[var(--text-muted)]">Sequences are defined in lib/email-sequences.ts and processed by /api/cron/daily.</p>
    </div>
  );
}
