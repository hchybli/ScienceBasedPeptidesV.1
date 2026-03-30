import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function LabReportBadge(props: {
  purity: number;
  labName: string;
  batchNumber: string;
  testedAt: number;
  reportUrl: string;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-accent/30 bg-accent-muted p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-accent">
            {props.purity}% purity — Verified by {props.labName}
          </p>
          <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
            Batch {props.batchNumber} · Tested {formatDate(props.testedAt)}
          </p>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <a href={props.reportUrl} target="_blank" rel="noreferrer">
            Download COA
          </a>
        </Button>
      </div>
    </div>
  );
}
