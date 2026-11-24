import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TypeBadge } from "@/components/TypeBadge";
import { loadBundle } from "@/lib/bundle";

export const dynamic = "force-dynamic";

function DecisionStatus({ status }: { status?: string }) {
  if (status === "accepted") {
    return <span className="badge badge-green">accepted</span>;
  }
  if (status === "superseded") {
    return <span className="badge badge-gray">superseded</span>;
  }
  return <span className="badge badge-outline">{status ?? "未設定"}</span>;
}

export default function DecisionsPage() {
  const bundle = loadBundle();
  const accepted = bundle.decisions.filter((d) => d.status === "accepted").length;
  const superseded = bundle.decisions.filter(
    (d) => d.status === "superseded",
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Architecture Decision Records"
        title="意思決定（ADR）一覧"
        description="法的判断や適用除外の判断を decision として記録した一覧です。判断対象の要件と現在のカバレッジ状態をあわせて確認できます。"
      />

      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card state-accent">
          <div className="stat-label">decision</div>
          <div className="stat-value">{bundle.decisions.length}</div>
          <div className="stat-hint">記録済みの判断</div>
        </div>
        <div className="stat-card state-green">
          <div className="stat-label">accepted</div>
          <div className="stat-value">{accepted}</div>
          <div className="stat-hint">有効な判断</div>
        </div>
        <div className="stat-card state-gray">
          <div className="stat-label">superseded</div>
          <div className="stat-value">{superseded}</div>
          <div className="stat-hint">置き換え済み</div>
        </div>
      </div>

      {bundle.decisions.length === 0 ? (
        <div className="card">
          <p className="empty">decision はまだ記録されていません。</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 100 }}>ID</th>
                <th style={{ minWidth: 280 }}>判断</th>
                <th style={{ width: 110 }}>status</th>
                <th style={{ minWidth: 260 }}>対象要件</th>
                <th style={{ width: 110 }}>verified</th>
                <th style={{ width: 110 }}>supersedes</th>
              </tr>
            </thead>
            <tbody>
              {bundle.decisions.map((decision) => (
                <tr key={decision.id}>
                  <td className="mono tiny">
                    <Link href={`/doc/${decision.id}`}>{decision.id}</Link>
                  </td>
                  <td>
                    <div className="title-line">
                      <TypeBadge type="decision" />
                      <Link href={`/doc/${decision.id}`}>
                        <strong>{decision.title}</strong>
                      </Link>
                    </div>
                    <div className="tiny muted">{decision.domain || "未分類"}</div>
                  </td>
                  <td>
                    <DecisionStatus status={decision.status} />
                  </td>
                  <td>
                    {decision.appliesTo.length === 0 ? (
                      <span className="muted">—</span>
                    ) : (
                      <ul className="plain-list">
                        {decision.appliesTo.map((lawId) => {
                          const law = bundle.byId[lawId];
                          const result = bundle.lawResultById[lawId];
                          return (
                            <li
                              key={lawId}
                              style={{
                                display: "flex",
                                gap: 6,
                                alignItems: "center",
                                flexWrap: "wrap",
                              }}
                            >
                              <Link href={`/law/${lawId}`}>
                                {law?.title ?? lawId}
                              </Link>
                              {result ? (
                                <StatusBadge status={result.status} />
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </td>
                  <td className="small">{decision.verified ?? "未設定"}</td>
                  <td className="mono tiny">
                    {decision.supersedes ? (
                      <Link href={`/doc/${decision.supersedes}`}>
                        {decision.supersedes}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="tiny muted">
        適用外の判定には、accepted の decision が対象要件を含み、本文に適用除外の理由が記載されていることが必要です。
      </p>
    </>
  );
}
