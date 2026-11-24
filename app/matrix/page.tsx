import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { loadBundle } from "@/lib/bundle";
import { percent } from "@/lib/format";
import type { Doc, LawResult } from "@/lib/types";

export const dynamic = "force-dynamic";

function countCell(docs: Doc[]) {
  if (docs.length === 0) {
    return <span className="count zero">—</span>;
  }
  return (
    <span
      className="count"
      title={docs.map((doc) => `${doc.id}: ${doc.title}`).join("\n")}
    >
      {docs.length}
    </span>
  );
}

function MatrixRow({ result }: { result: LawResult }) {
  return (
    <tr>
      <td>
        <div className="mono tiny muted">{result.law.id}</div>
        <Link href={`/law/${result.law.id}`}>
          <strong>{result.law.title}</strong>
        </Link>
      </td>
      <td>{countCell(result.rules)}</td>
      <td>{countCell(result.procedures)}</td>
      <td>{countCell(result.manuals)}</td>
      <td>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {countCell(result.evidences)}
          {result.expiredEvidences.length > 0 ? (
            <span
              className="badge badge-red"
              title={result.expiredEvidences
                .map((doc) => `${doc.id}（expires ${doc.expires}）`)
                .join("\n")}
            >
              期限切れ {result.expiredEvidences.length}
            </span>
          ) : null}
        </div>
      </td>
      <td>
        <StatusBadge status={result.status} />
      </td>
    </tr>
  );
}

export default function MatrixPage() {
  const bundle = loadBundle();
  const byDomain = bundle.domains.map((domain) => ({
    domain,
    results: bundle.lawResults.filter(
      (result) => (result.law.domain || "未分類") === domain.domain,
    ),
  }));

  return (
    <>
      <PageHeader
        eyebrow="Coverage Matrix"
        title="カバレッジマトリクス"
        description="行＝法令要件（領域でグルーピング）、列＝紐づく規則・手順・マニュアル・証跡。セルの数字は件数です。要件名から詳細へ移動できます。"
      />

      <div className="stat-grid" style={{ marginBottom: 16 }}>
        {bundle.domains.map((domain) => (
          <div className="stat-card" key={domain.domain}>
            <div className="stat-label">{domain.domain}</div>
            <div className="stat-value" style={{ fontSize: 20 }}>
              {percent(domain.rate)}
            </div>
            <div className="stat-hint">
              {domain.covered}/{domain.denominator} 対応済み・全 {domain.total}
            </div>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <table className="data-table matrix-table">
          <thead>
            <tr>
              <th style={{ minWidth: 280 }}>法令要件</th>
              <th style={{ width: 74 }}>規則</th>
              <th style={{ width: 74 }}>手順</th>
              <th style={{ width: 90 }}>マニュアル</th>
              <th style={{ width: 120 }}>証跡</th>
              <th style={{ width: 100 }}>状態</th>
            </tr>
          </thead>
          <tbody>
            {byDomain.map(({ domain, results }) => (
              <DomainGroup
                key={domain.domain}
                domain={domain.domain}
                results={results}
                rate={domain.rate}
              />
            ))}
          </tbody>
        </table>
      </div>

      <p className="tiny muted">
        「—」は紐づく文書がないセルです。証跡の「期限切れ」は有効期限を過ぎた証跡の件数で、有効な証跡が別にあれば要件の状態には影響しません。
      </p>
    </>
  );
}

function DomainGroup({
  domain,
  results,
  rate,
}: {
  domain: string;
  results: LawResult[];
  rate: number;
}) {
  return (
    <>
      <tr className="domain-row">
        <td colSpan={6}>
          {domain}（{results.length}件・対応済み率 {percent(rate)}）
        </td>
      </tr>
      {results.map((result) => (
        <MatrixRow key={result.law.id} result={result} />
      ))}
    </>
  );
}
