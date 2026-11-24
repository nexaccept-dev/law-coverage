import { STATUS_META, type CoverageStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: CoverageStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`badge badge-${meta.tone}`} title={meta.description}>
      {meta.label}
    </span>
  );
}
