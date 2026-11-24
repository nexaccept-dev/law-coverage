import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TypeBadge } from "@/components/TypeBadge";
import { loadBundle } from "@/lib/bundle";
import { compareGapResults } from "@/lib/engine";
import {
  STATUS_META,
  type CoverageStatus,
  type Doc,
  type LawResult,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const GAP_STATUSES: CoverageStatus[] = [
  "missing",
  "stale",
  "no_rule",
  "no_procedure",
  "no_evidence",
  "excluded",
];

function isGapStatus(value: string | undefined): value is CoverageStatus {
  return Boolean(value && GAP_STATUSES.includes(value as CoverageStatus));
}

function LinkedDocs({ result }: { result: LawResult }) {
  const docs: Doc[] = [
    ...result.rules,
    ...result.procedures,
    ...result.manuals,
    ...result.settings,
    ...result.evidences,
  ];
  if (docs.length === 0) {
    return <span className="muted">—</span>;
  }
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {docs.map((doc) => (
        <span
          key={doc.id}
          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <TypeBadge type={doc.type} />
          <Link href={`/doc/${doc.id}`} className="mono tiny">
            {doc.id}
          </Link>
        </span>
      ))}
    </div>
  );
}

export default async function GapsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const bundle = loadBundle();
  const params = await searchParams;
  const rawStatus = Array.isArray(params.status)
    ? params.status[0]
    : params.status;
  const activeStatus = isGapStatus(rawStatus) ? rawStatus : null;

  const allGaps = bundle.lawResults
    .filter((result) => result.status !== "covered")
    .sort(compareGapResults);
  const visible = activeStatus
    ? allGaps.filter((result) => result.status === activeStatus)
    : allGaps;

  return (
    <>
      <PageHeader
        eyebrow="Coverage Gaps"
        title="ギャップ一覧"
        description="対応済み以外の要件を、優先度の高い順（未対応 → 鮮度切れ → 根拠なし → 手順なし → 証跡なし → 適用外）に並べています。状態で絞り込めます。"
        actions={
          <Link className="filter-link" href="/report">
            診断レポートを見る
          </Link>
        }
      />

      <div className="filter-bar">
        <Link
          href="/gaps"
          className={`filter-link ${activeStatus === null ? "active" : ""}`}
        >
          すべて <span className="filter-count">{allGaps.length}</span>
        </Link>
        {GAP_STATUSES.map((status) => {
          const count = bundle.statusCounts[status];
          return (
            <Link
              key={status}
              href={`/gaps?status=${status}`}
              className={`filter-link ${activeStatus === status ? "active" : ""}`}
            >
              {STATUS_META[status].label}{" "}
              <span className="filter-count">{count}</span>
            </Link>
          );
        })}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 92 }}>状態</th>
              <th style={{ minWidth: 250 }}>法令要件</th>
              <th style={{ width: 110 }}>領域</th>
              <th style={{ minWidth: 300 }}>理由</th>
              <th style={{ minWidth: 210 }}>紐づく文書</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <p className="empty">該当する要件はありません。</p>
                </td>
              </tr>
            ) : (
              visible.map((result) => (
                <tr key={result.law.id}>
                  <td>
                    <StatusBadge status={result.status} />
                  </td>
                  <td>
                    <div className="mono tiny muted">{result.law.id}</div>
                    <Link href={`/law/${result.law.id}`}>
                      <strong>{result.law.title}</strong>
                    </Link>
                  </td>
                  <td className="small">{result.law.domain || "未分類"}</td>
                  <td className="small">{result.reason}</td>
                  <td>
                    <LinkedDocs result={result} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="tiny muted">
        適用外は decision に適用除外の理由が記録されている要件です。必要に応じて判断の見直し対象としてください。
      </p>
    </>
  );
}
