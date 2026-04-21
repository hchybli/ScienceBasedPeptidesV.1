export default function AdminEmailSequencesPage() {
  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-2xl font-semibold">Email sequences</h2>
      <p className="mt-4 text-[var(--text-muted)]">Sequences are defined in lib/email-sequences.ts and processed by /api/cron/daily.</p>
    </div>
  );
}
