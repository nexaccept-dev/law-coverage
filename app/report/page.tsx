import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TypeBadge } from "@/components/TypeBadge";
import { loadBundle } from "@/lib/bundle";
import { percent, truncate } from "@/lib/format";
import { STATUS_META, STATUS_ORDER, type CoverageStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const BAD_STATUSES: CoverageStatus[] = [
  "missing",
  "stale",
  "no_rule",
  "no_procedure",
  "no_evidence",
];

export default function ReportPage() {
  const bundle = loadBundle();
  const diagnostics = bundle.diagnostics;
  const total = bundle.laws.length;
  const excluded = bundle.statusCounts.excluded;
  const gaps = total - excluded - bundle.statusCounts.covered;

  const docTypeCounts = bundle.docs.reduce<Record<string, number>>(
    (accumulator, doc) => {
      accumulator[doc.type] = (accumulator[doc.type] ?? 0) + 1;
      return accumulator;
    },
    {},
  );

  return (
    <>
      <PageHeader
        eyebrow="Diagnostic Report"
        title="診断レポート"
        description={
          <>
            対象バンドル <span className="badge badge-outline">{bundle.sourceKind}</span>{" "}
            の健全性を、良い点・悪い点・過剰の3観点で1画面に集約しています。判定日{" "}
            <strong>{bundle.today}</strong>。
          </>
        }
        actions={
          <>
            <Link className="filter-link" href="/gaps">
              ギャップ一覧
            </Link>
            <Link className="filter-link" href="/">
              ダッシュボード
            </Link>
          </>
        }
      />

      <div className="stat-grid">
        <div className="stat-card state-accent">
          <div className="stat-label">カバー率</div>
          <div className="stat-value">{percent(bundle.coverageRate)}</div>
          <div className="stat-hint">
            {bundle.statusCounts.covered} / {total - excluded} 要件
          </div>
        </div>
        <div className="stat-card state-green">
          <div className="stat-label">対応済み</div>
          <div className="stat-value">{bundle.statusCounts.covered}</div>
          <div className="stat-hint">規則・手順・証跡が揃った要件</div>
        </div>
        <div className="stat-card state-red">
          <div className="stat-label">要対応</div>
          <div className="stat-value">{gaps}</div>
          <div className="stat-hint">適用外を除く不足・ギャップ</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">文書鮮度</div>
          <div className="stat-value">{percent(diagnostics.freshnessRate)}</div>
          <div className="stat-hint">
            {diagnostics.freshDocs.length} / {diagnostics.freshnessCandidates.length}{" "}
            文書が有効
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">孤立文書</div>
          <div className="stat-value">{diagnostics.orphanDocs.length}</div>
          <div className="stat-hint">どの law にも covers されていない</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">形式エラー</div>
          <div className="stat-value">{diagnostics.formatIssues.length}</div>
          <div className="stat-hint">参照切れ・必須項目欠けなど</div>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>バンドル情報と状態分布</h2>
          <span className="note">
            全 {bundle.docs.length} ファイル（law {docTypeCounts.law ?? 0} / rule{" "}
            {docTypeCounts.rule ?? 0} / procedure {docTypeCounts.procedure ?? 0} /
            manual {docTypeCounts.manual ?? 0} / evidence{" "}
            {docTypeCounts.evidence ?? 0} / decision {docTypeCounts.decision ?? 0}）
          </span>
        </div>
        <div className="card">
          <dl className="kv" style={{ marginBottom: 14 }}>
            <dt>バンドル</dt>
            <dd className="mono">{bundle.bundleDir}</dd>
            <dt>ソース区分</dt>
            <dd>{bundle.sourceKind}</dd>
            <dt>判定日</dt>
            <dd>{bundle.today}</dd>
          </dl>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            {STATUS_ORDER.map((status) => (
              <Link
                key={status}
                href={
                  status === "covered"
                    ? "/matrix"
                    : `/gaps?status=${status}`
                }
                className="filter-link"
              >
                <StatusBadge status={status} />
                <span className="filter-count">
                  {bundle.statusCounts[status]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>形式エラー（構造の健全性）</h2>
          <span className="note">診断の最初に確認するバンドル形式の問題</span>
        </div>
        {diagnostics.formatIssues.length === 0 ? (
          <div className="callout good">
            <h3>形式エラーはありません</h3>
            <p className="small" style={{ margin: 0 }}>
              必須項目・type・参照（covers / supports / applies_to / supersedes）に問題は見つかりませんでした。
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 180 }}>ファイル</th>
                  <th style={{ width: 160 }}>ID</th>
                  <th>内容</th>
                </tr>
              </thead>
              <tbody>
                {diagnostics.formatIssues.map((issue, index) => (
                  <tr key={`${issue.file}-${index}`}>
                    <td className="mono tiny">{issue.file}</td>
                    <td className="mono tiny">{issue.id ?? "—"}</td>
                    <td className="small">{issue.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid-2 section">
        <div>
          <div className="section-head">
            <h2>良い点</h2>
          </div>
          <div className="stack">
            <div className="callout good">
              <h3>対応済みの要件: {diagnostics.coveredLaws.length}件</h3>
              {diagnostics.coveredLaws.length === 0 ? (
                <p className="empty">対応済みの要件はまだありません。</p>
              ) : (
                <ul className="plain-list">
                  {diagnostics.coveredLaws.map((result) => (
                    <li key={result.law.id}>
                      <Link href={`/law/${result.law.id}`}>
                        {result.law.title}
                      </Link>{" "}
                      <span className="mono tiny muted">{result.law.id}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="callout good">
              <h3>
                判断が decision として記録されている要件:{" "}
                {diagnostics.lawsWithDecisions.length}件
              </h3>
              {diagnostics.lawsWithDecisions.length === 0 ? (
                <p className="empty">判断記録はありません。</p>
              ) : (
                <ul className="plain-list">
                  {diagnostics.lawsWithDecisions.map((result) => (
                    <li key={result.law.id}>
                      <Link href={`/law/${result.law.id}`}>
                        {result.law.title}
                      </Link>
                      <div className="tiny muted">
                        {result.decisions.map((decision) => (
                          <span key={decision.id}>
                            <Link href={`/doc/${decision.id}`}>
                              {decision.id}
                            </Link>
                            （{decision.status}）{" "}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="callout good">
              <h3>鮮度が保たれている文書: {percent(diagnostics.freshnessRate)}</h3>
              <p className="small" style={{ margin: 0 }}>
                規則・手順・マニュアル・証跡のうち{" "}
                {diagnostics.freshDocs.length} /{" "}
                {diagnostics.freshnessCandidates.length} 文書が有効です。
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="section-head">
            <h2>悪い点（不足）</h2>
          </div>
          <div className="stack">
            {BAD_STATUSES.map((status) => (
              <div className="callout bad" key={status}>
                <div className="list-row" style={{ borderBottom: "none", padding: 0 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>
                      {STATUS_META[status].label}:{" "}
                      {bundle.statusCounts[status]}件
                    </h3>
                    <p className="small muted" style={{ margin: "2px 0 0" }}>
                      {STATUS_META[status].description}
                    </p>
                  </div>
                  <Link
                    className="filter-link"
                    href={`/gaps?status=${status}`}
                  >
                    一覧へ
                  </Link>
                </div>
              </div>
            ))}

            <div className="callout warn">
              <h3>
                鮮度切れ・期限切れの文書:{" "}
                {diagnostics.staleOrExpiredDocs.length}件
              </h3>
              {diagnostics.staleOrExpiredDocs.length === 0 ? (
                <p className="empty">該当なし。</p>
              ) : (
                <ul className="plain-list">
                  {diagnostics.staleOrExpiredDocs.map((doc) => (
                    <li key={doc.id}>
                      <span className="title-line">
                        <TypeBadge type={doc.type} />
                        <Link href={`/doc/${doc.id}`}>{doc.title}</Link>
                      </span>
                      <div className="tiny muted">
                        {doc.type === "evidence"
                          ? `expires ${doc.expires}（期限切れ）`
                          : `stale_after ${doc.staleAfter}（鮮度切れ）`}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 section">
        <div>
          <div className="section-head">
            <h2>過剰・棚卸し対象（孤立文書）</h2>
            <span className="note">どの law にも covers されていない規則・手順・マニュアル</span>
          </div>
          <div className="card">
            {diagnostics.orphanDocs.length === 0 ? (
              <p className="empty">孤立文書はありません。</p>
            ) : (
              <ul className="plain-list">
                {diagnostics.orphanDocs.map((doc) => (
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
                        covers: {doc.covers.length > 0 ? doc.covers.join("、") : "（空）"}
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
            <h2>重複した文書の偏り</h2>
            <span className="note">同じ要件に同種の文書が複数紐づいているケース</span>
          </div>
          <div className="card">
            {diagnostics.duplicateBiases.length === 0 ? (
              <p className="empty">重複の偏りはありません。</p>
            ) : (
              <ul className="plain-list">
                {diagnostics.duplicateBiases.map((bias) => {
                  const groups = [
                    { label: "規則", docs: bias.rules },
                    { label: "手順", docs: bias.procedures },
                    { label: "マニュアル", docs: bias.manuals },
                  ].filter((group) => group.docs.length > 1);
                  return (
                    <li className="list-row" key={bias.lawId}>
                      <div>
                        <div className="title-line">
                          <Link href={`/law/${bias.lawId}`}>
                            <strong>{bias.lawTitle}</strong>
                          </Link>
                          <span className="mono tiny muted">{bias.lawId}</span>
                        </div>
                        {groups.map((group) => (
                          <div className="tiny muted" key={group.label}>
                            {group.label}:{" "}
                            {group.docs
                              .map((doc) => `${doc.id}「${truncate(doc.title, 40)}」`)
                              .join("、")}
                          </div>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
