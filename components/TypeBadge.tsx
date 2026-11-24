import { TYPE_LABELS, type DocType } from "@/lib/types";

export function TypeBadge({ type }: { type: DocType }) {
  return (
    <span className={`type-badge type-${type}`}>
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}
