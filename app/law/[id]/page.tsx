import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/Markdown";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TypeBadge } from "@/components/TypeBadge";
import { loadBundle } from "@/lib/bundle";
import { isExpired, isStale } from "@/lib/engine";
import type { Doc } from "@/lib/types";

export const dynamic = "force-dynamic";

function DocCard({
  doc,
  today,
  category,
}: {
  doc: Doc;
  today: string;
  category: "rule" | "procedure" | "manual" | "evidence";
}) {
  const expired = isExpired(doc, today);
  const stale = isStale(doc, today);
  return (
    <div className="doc-card">
      <div className="doc-card-head">
        <div>
          <div className="title-line" style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <TypeBadge type={doc.type} />
            <Link href={`/doc/${doc.id}`} className="doc-card-title">
              {doc.title}
            </Link>
          </div>
          <div className="doc-card-meta mono">{doc.id}</div>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {category === "evidence" ? (
            expired ? (
              <span className="badge badge-red">期限切れ</span>
            ) : (
              <span className="badge badge-green">有効</span>
            )
          ) : stale ? (
            <span className="badge badge-orange">鮮度切れ</span>
          ) : (
            <span className="badge badge-green">鮮度OK</span>
          )}
        </div>
      </div>
      <div className="doc-card-extra">
        verified {doc.verified ?? "未設定"}
        {doc.type === "evidence"
          ? ` ／ expires ${doc.expires ?? "なし"}`
          : doc.staleAfter
            ? ` ／ stale_after ${doc.staleAfter}`
            : " ／ stale_after なし"}
      </div>
    </div>
  );
}

export default async function LawDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const bundle = loadBundle();
  const { id } = await params;
  const result = bundle.lawResultById[id];
  if (!result) notFound();
  const law = result.law;

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">ダッシュボード</Link> / <Link href="/matrix">マトリクス</Link>{" "}
        / <Link href="/gaps">ギャップ一覧</Link>
      </div>

      <PageHeader
        eyebrow={`${law.id} ／ ${law.domain || "未分類"}`}
        title={law.title}
        description={
          <div className="meta-strip">
            <StatusBadge status={result.status} />
            <span>出典: {law.source ?? "未設定"}</span>
            <span>verified {law.verified ?? "未設定"}</span>
          </div>
        }
        actions={
          <Link className="filter-link" href={`/gaps?status=${result.status}`}>
            同じ状態の要件
          </Link>
        }
      />

      <div className="detail-grid">
        <div className="stack">
          <div className="card">
            <div className="section-head">
              <h2>判定結果</h2>
              <span className="mono tiny muted">判定日 {bundle.today}</span>
            </div>
            <div className="status-hero">
              <StatusBadge status={result.status} />
              <div className="status-hero-main">
                <p className="status-reason" style={{ marginTop: 0 }}>
                  {result.reason}
                </p>
              </div>
            </div>
            {result.staleDocuments.length > 0 ? (
              <div className="callout warn" style={{ marginTop: 12 }}>
                <h3>鮮度切れの文書</h3>
                <ul className="plain-list">
                  {result.staleDocuments.map((doc) => (
                    <li key={doc.id}>
                      <Link href={`/doc/${doc.id}`}>{doc.id}</Link>{" "}
                      {doc.title}（stale_after {doc.staleAfter}）
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.expiredEvidences.length > 0 ? (
              <div className="callout warn" style={{ marginTop: 12 }}>
                <h3>期限切れの証跡</h3>
                <ul className="plain-list">
                  {result.expiredEvidences.map((doc) => (
                    <li key={doc.id}>
                      <Link href={`/doc/${doc.id}`}>{doc.id}</Link>{" "}
                      {doc.title}（expires {doc.expires}）
                      {result.validEvidences.length > 0
                        ? "。有効な証跡が別にあるため状態には影響しません。"
                        : "。有効な証跡がありません。"}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="card">
            <div className="section-head">
              <h2>要件内容</h2>
            </div>
            <Markdown source={law.body} />
          </div>

          <div className="card">
            <div className="section-head">
              <h2>紐づく文書</h2>
              <span className="note">
                規則 {result.rules.length} / 手順 {result.procedures.length} /
                マニュアル {result.manuals.length} / 証跡 {result.evidences.length}
              </span>
            </div>

            <h3 className="small" style={{ marginBottom: 6 }}>
              規則
            </h3>
            {result.rules.length === 0 ? (
              <p className="empty">紐づく規則はありません。</p>
            ) : (
              result.rules.map((doc) => (
                <DocCard key={doc.id} doc={doc} today={bundle.today} category="rule" />
              ))
            )}

            <h3 className="small" style={{ margin: "16px 0 6px" }}>
              手順
            </h3>
            {result.procedures.length === 0 ? (
              <p className="empty">紐づく手順はありません。</p>
            ) : (
              result.procedures.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  today={bundle.today}
                  category="procedure"
                />
              ))
            )}

            <h3 className="small" style={{ margin: "16px 0 6px" }}>
              マニュアル
            </h3>
            {result.manuals.length === 0 ? (
              <p className="empty">紐づくマニュアルはありません。</p>
            ) : (
              result.manuals.map((doc) => (
                <DocCard key={doc.id} doc={doc} today={bundle.today} category="manual" />
              ))
            )}

            <h3 className="small" style={{ margin: "16px 0 6px" }}>
              証跡
            </h3>
            {result.evidences.length === 0 ? (
              <p className="empty">紐づく証跡はありません。</p>
            ) : (
              result.evidences.map((doc) => (
                <DocCard key={doc.id} doc={doc} today={bundle.today} category="evidence" />
              ))
            )}
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>メタデータ</h2>
            <dl className="kv">
              <dt>ID</dt>
              <dd className="mono">{law.id}</dd>
              <dt>領域</dt>
              <dd>{law.domain || "未分類"}</dd>
              <dt>出典</dt>
              <dd>{law.source ?? "未設定"}</dd>
              <dt>Source URL</dt>
              <dd className="source-link">
                {law.sourceUrl ? (
                  <a href={law.sourceUrl} target="_blank" rel="noreferrer">
                    {law.sourceUrl}
                  </a>
                ) : (
                  "未設定"
                )}
              </dd>
              <dt>verified</dt>
              <dd>{law.verified ?? "未設定"}</dd>
              <dt>ファイル</dt>
              <dd className="mono">{law.file}</dd>
            </dl>
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>関連 decision</h2>
            {result.decisions.length === 0 ? (
              <p className="empty">この要件に対する decision はありません。</p>
            ) : (
              <ul className="plain-list">
                {result.decisions.map((decision) => (
                  <li key={decision.id}>
                    <div className="title-line">
                      <TypeBadge type="decision" />
                      <Link href={`/doc/${decision.id}`}>
                        {decision.title}
                      </Link>
                    </div>
                    <div className="tiny muted">
                      {decision.id} ／ status: {decision.status} ／ verified{" "}
                      {decision.verified ?? "未設定"}
                    </div>
                    {result.exclusionDecision?.id === decision.id ? (
                      <span className="badge badge-gray" style={{ marginTop: 4 }}>
                        適用外の根拠
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>鮮度サマリ</h2>
            <dl className="kv">
              <dt>有効な証跡</dt>
              <dd>{result.validEvidences.length} 件</dd>
              <dt>期限切れ</dt>
              <dd>{result.expiredEvidences.length} 件</dd>
              <dt>鮮度切れ文書</dt>
              <dd>{result.staleDocuments.length} 件</dd>
              <dt>関連 decision</dt>
              <dd>{result.decisions.length} 件</dd>
            </dl>
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>導線</h2>
            <ul className="plain-list small">
              <li>
                <Link href="/matrix">マトリクスで前後の要件を見る</Link>
              </li>
              <li>
                <Link href="/gaps">ギャップ一覧に戻る</Link>
              </li>
              <li>
                <Link href="/decisions">decision 一覧を見る</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
