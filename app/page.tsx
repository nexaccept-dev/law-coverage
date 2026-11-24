import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TypeBadge } from "@/components/TypeBadge";
import { loadBundle } from "@/lib/bundle";
import { compareGapResults } from "@/lib/engine";
import { percent, truncate } from "@/lib/format";
import { STATUS_META, STATUS_ORDER } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const bundle = loadBundle();
  const total = bundle.laws.length;
  const excluded = bundle.statusCounts.excluded;
  const denominator = total - excluded;
  const gaps = bundle.lawResults
    .filter((result) => result.status !== "covered")
    .sort(compareGapResults);
  const topGaps = gaps.slice(0, 12);
  const staleDocs = bundle.diagnostics.staleOrExpiredDocs;

  return (
    <>
      <PageHeader
        eyebrow="Coverage Overview"
        title="法令カバレッジ ダッシュボード"
        description={
          <>
            OKFバンドルの紐づけと鮮度から、法令要件のカバレッジを機械判定しています。
            判定日 <strong>{bundle.today}</strong>／バンドル{" "}
            <span className="badge badge-outline">{bundle.sourceKind}</span>
          </>
        }
        actions={
          <>
            <Link className="filter-link" href="/gaps">
              ギャップ一覧
            </Link>
            <Link className="filter-link" href="/report">
              診断レポート
            </Link>
          </>
        }
      />

      <div className="stat-grid">
        <div className="stat-card state-accent">
          <div className="stat-label">全体カバー率</div>
          <div className="stat-value">{percent(bundle.coverageRate)}</div>
          <div className="stat-hint">
            対応済み {bundle.statusCounts.covered} ÷（全 {total} − 適用外{" "}
            {excluded}）
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">法令要件</div>
          <div className="stat-value">
            {total}
            <span className="unit">件</span>
          </div>
          <div className="stat-hint">判定対象の law ドキュメント</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">要対応</div>
          <div className="stat-value">
            {denominator - bundle.statusCounts.covered}
            <span className="unit">件</span>
          </div>
          <div className="stat-hint">適用外を除く未対応・不足</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">文書の鮮度</div>
          <div className="stat-value">{percent(bundle.diagnostics.freshnessRate)}</div>
          <div className="stat-hint">
            {bundle.diagnostics.freshDocs.length} /{" "}
            {bundle.diagnostics.freshnessCandidates.length} 文書が有効
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>状態別件数</h2>
          <span className="note">
            優先順位: 適用外 → 未対応 → 鮮度切れ → 手順なし → 根拠なし → 証跡なし → 対応済み
          </span>
        </div>
        <div className="stat-grid">
          {STATUS_ORDER.map((status) => {
            const meta = STATUS_META[status];
            return (
              <Link
                key={status}
                href={`/gaps?status=${status}`}
                className={`stat-card state-${meta.tone}`}
                style={{ color: "inherit", textDecoration: "none" }}
              >
                <div className="stat-label">{meta.label}</div>
                <div className="stat-value">
                  {bundle.statusCounts[status]}
                  <span className="unit">件</span>
                </div>
                <div className="stat-hint">{meta.description}</div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>領域別カバー率</h2>
          <span className="note">対応済み ÷（領域の全要件 − 適用外）</span>
        </div>
        <div className="card">
          <div className="bar-list">
            {bundle.domains.map((domain) => (
              <div className="bar-row" key={domain.domain}>
                <div className="bar-label" title={domain.domain}>
                  {domain.domain}
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${Math.min(domain.rate, 100)}%` }}
                  />
                </div>
                <div className="bar-value">
                  {percent(domain.rate)}{" "}
                  <span className="muted">
                    ({domain.covered}/{domain.denominator})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2 section">
        <div>
          <div className="section-head">
            <h2>要対応の上位</h2>
            <Link href="/gaps" className="small">
              すべて見る
            </Link>
          </div>
          <div className="card">
            {topGaps.length === 0 ? (
              <p className="empty">要対応の要件はありません。</p>
            ) : (
              <ul className="plain-list">
                {topGaps.map((result) => (
                  <li className="list-row" key={result.law.id}>
                    <div>
                      <div className="title-line">
                        <StatusBadge status={result.status} />
                        <Link href={`/law/${result.law.id}`}>
                          <strong>{result.law.title}</strong>
                        </Link>
                      </div>
                      <div className="tiny muted mono">{result.law.id}</div>
                      <div className="tiny muted">
                        {truncate(result.reason, 150)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <div className="section-head">
            <h2>鮮度切れ・期限切れ</h2>
            <Link href="/report" className="small">
              診断レポート
            </Link>
          </div>
          <div className="card">
            {staleDocs.length === 0 ? (
              <p className="empty">鮮度切れ・期限切れの文書はありません。</p>
            ) : (
              <ul className="plain-list">
                {staleDocs.map((doc) => (
                  <li className="list-row" key={doc.id}>
                    <div>
                      <div className="title-line">
                        <TypeBadge type={doc.type} />
                        <Link href={`/doc/${doc.id}`}>
                          <strong>{doc.title}</strong>
                        </Link>
                      </div>
                      <div className="tiny muted mono">{doc.id}</div>
                      <div className="tiny muted">
                        {doc.type === "evidence"
                          ? `有効期限 ${doc.expires ?? "未設定"}（期限切れ）`
                          : `stale_after ${doc.staleAfter ?? "未設定"}（鮮度切れ）`}
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        doc.type === "evidence" ? "badge-red" : "badge-orange"
                      }`}
                    >
                      {doc.type === "evidence" ? "期限切れ" : "鮮度切れ"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h2 style={{ marginTop: 0 }}>バンドル情報</h2>
            <dl className="kv">
              <dt>ソース</dt>
              <dd>{bundle.sourceKind}</dd>
              <dt>パス</dt>
              <dd className="mono">{bundle.bundleDir}</dd>
              <dt>判定日</dt>
              <dd>{bundle.today}</dd>
              <dt>ファイル数</dt>
              <dd>{bundle.docs.length} 件</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
}
