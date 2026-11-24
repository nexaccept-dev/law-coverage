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

function lawStatusFor(
  bundle: ReturnType<typeof loadBundle>,
  id: string,
) {
  return bundle.lawResultById[id];
}

function LawLinkRow({
  bundle,
  law,
}: {
  bundle: ReturnType<typeof loadBundle>;
  law: Doc;
}) {
  const result = lawStatusFor(bundle, law.id);
  return (
    <li className="list-row">
      <div>
        <div className="title-line">
          <TypeBadge type="law" />
          <Link href={`/law/${law.id}`}>
            <strong>{law.title}</strong>
          </Link>
        </div>
        <div className="tiny muted mono">{law.id}</div>
      </div>
      {result ? <StatusBadge status={result.status} /> : null}
    </li>
  );
}

export default async function DocDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const bundle = loadBundle();
  const { id } = await params;
  const doc = bundle.byId[id];
  if (!doc) notFound();

  const expired = isExpired(doc, bundle.today);
  const stale = isStale(doc, bundle.today);
  const lawResult = doc.type === "law" ? bundle.lawResultById[doc.id] : undefined;
  const supersededBy = bundle.docs.filter((item) => item.supersedes === doc.id);

  const coverLaws = doc.covers
    .map((coverId) => bundle.byId[coverId])
    .filter((item): item is Doc => Boolean(item));
  const supportTargets = doc.supports
    .map((supportId) => bundle.byId[supportId])
    .filter((item): item is Doc => Boolean(item));
  const applyTargets = doc.appliesTo
    .map((applyId) => bundle.byId[applyId])
    .filter((item): item is Doc => Boolean(item));

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">ダッシュボード</Link> /{" "}
        {doc.type === "law" ? (
          <>
            <Link href="/matrix">マトリクス</Link> /{" "}
            <Link href={`/law/${doc.id}`}>要件詳細</Link>
          </>
        ) : doc.type === "decision" ? (
          <Link href="/decisions">意思決定（ADR）</Link>
        ) : (
          <Link href="/gaps">ギャップ一覧</Link>
        )}
      </div>

      <PageHeader
        eyebrow={`${doc.id} ／ ${doc.domain || "未分類"}`}
        title={doc.title}
        description={
          <div className="meta-strip">
            <TypeBadge type={doc.type} />
            {doc.type === "evidence" ? (
              expired ? (
                <span className="badge badge-red">期限切れ</span>
              ) : (
                <span className="badge badge-green">有効な証跡</span>
              )
            ) : doc.type === "decision" ? (
              <span className="badge badge-outline">{doc.status ?? "status 未設定"}</span>
            ) : stale ? (
              <span className="badge badge-orange">鮮度切れ</span>
            ) : (
              <span className="badge badge-green">鮮度OK</span>
            )}
            <span>verified {doc.verified ?? "未設定"}</span>
            <span className="mono">{doc.file}</span>
          </div>
        }
        actions={
          doc.type === "law" ? (
            <Link className="filter-link" href={`/law/${doc.id}`}>
              要件詳細へ
            </Link>
          ) : doc.type === "decision" ? (
            <Link className="filter-link" href="/decisions">
              ADR一覧へ
            </Link>
          ) : (
            <Link className="filter-link" href="/report">
              診断レポートへ
            </Link>
          )
        }
      />

      <div className="detail-grid">
        <div className="stack">
          <div className="card">
            <div className="section-head">
              <h2>本文</h2>
              <span className="mono tiny muted">判定日 {bundle.today}</span>
            </div>
            <Markdown source={doc.body} />
          </div>

          {doc.type === "law" && lawResult ? (
            <div className="card">
              <div className="section-head">
                <h2>カバレッジ判定</h2>
                <StatusBadge status={lawResult.status} />
              </div>
              <p className="status-reason" style={{ marginTop: 0 }}>
                {lawResult.reason}
              </p>
              <div className="meta-strip">
                <span>規則 {lawResult.rules.length}</span>
                <span>手順 {lawResult.procedures.length}</span>
                <span>マニュアル {lawResult.manuals.length}</span>
                <span>証跡 {lawResult.evidences.length}</span>
              </div>
            </div>
          ) : null}

          {doc.type === "rule" ||
          doc.type === "procedure" ||
          doc.type === "manual" ? (
            <div className="card">
              <div className="section-head">
                <h2>covers 先の要件</h2>
                <span className="note">{coverLaws.length} 件</span>
              </div>
              {coverLaws.length === 0 ? (
                <p className="empty">
                  どの law にも covers されていません（孤立文書の候補）。
                </p>
              ) : (
                <ul className="plain-list">
                  {coverLaws.map((law) => (
                    <LawLinkRow key={law.id} bundle={bundle} law={law} />
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {doc.type === "evidence" ? (
            <div className="card">
              <div className="section-head">
                <h2>supports 先（裏づけ対象）</h2>
                <span className="note">{supportTargets.length} 件</span>
              </div>
              {supportTargets.length === 0 ? (
                <p className="empty">supports 先がありません。</p>
              ) : (
                <ul className="plain-list">
                  {supportTargets.map((target) =>
                    target.type === "law" ? (
                      <LawLinkRow key={target.id} bundle={bundle} law={target} />
                    ) : (
                      <li className="list-row" key={target.id}>
                        <div>
                          <div className="title-line">
                            <TypeBadge type={target.type} />
                            <Link href={`/doc/${target.id}`}>
                              <strong>{target.title}</strong>
                            </Link>
                          </div>
                          <div className="tiny muted mono">{target.id}</div>
                        </div>
                        <span className="badge badge-outline">
                          {target.type === "rule" ? "規則を裏づけ" : target.type}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>
          ) : null}

          {doc.type === "decision" ? (
            <div className="card">
              <div className="section-head">
                <h2>applies_to（判断対象）</h2>
                <span className="note">{applyTargets.length} 件</span>
              </div>
              {applyTargets.length === 0 ? (
                <p className="empty">判断対象がありません。</p>
              ) : (
                <ul className="plain-list">
                  {applyTargets.map((target) =>
                    target.type === "law" ? (
                      <LawLinkRow key={target.id} bundle={bundle} law={target} />
                    ) : (
                      <li className="list-row" key={target.id}>
                        <div>
                          <Link href={`/doc/${target.id}`}>{target.title}</Link>
                          <div className="tiny muted mono">{target.id}</div>
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        <div className="stack">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>frontmatter</h2>
            <dl className="kv">
              <dt>type</dt>
              <dd>{doc.type}</dd>
              <dt>domain</dt>
              <dd>{doc.domain || "未分類"}</dd>
              <dt>verified</dt>
              <dd>{doc.verified ?? "未設定"}</dd>
              {doc.staleAfter ? (
                <>
                  <dt>stale_after</dt>
                  <dd>{doc.staleAfter}</dd>
                </>
              ) : null}
              {doc.expires ? (
                <>
                  <dt>expires</dt>
                  <dd>
                    {doc.expires}{" "}
                    {expired ? (
                      <span className="badge badge-red">期限切れ</span>
                    ) : (
                      <span className="badge badge-green">有効</span>
                    )}
                  </dd>
                </>
              ) : null}
              {doc.source ? (
                <>
                  <dt>source</dt>
                  <dd>{doc.source}</dd>
                </>
              ) : null}
              {doc.sourceUrl ? (
                <>
                  <dt>source_url</dt>
                  <dd className="source-link">
                    <a href={doc.sourceUrl} target="_blank" rel="noreferrer">
                      {doc.sourceUrl}
                    </a>
                  </dd>
                </>
              ) : null}
              {doc.status ? (
                <>
                  <dt>status</dt>
                  <dd>{doc.status}</dd>
                </>
              ) : null}
              {doc.supersedes ? (
                <>
                  <dt>supersedes</dt>
                  <dd>
                    <Link href={`/doc/${doc.supersedes}`}>{doc.supersedes}</Link>
                  </dd>
                </>
              ) : null}
              <dt>covers</dt>
              <dd>
                {doc.covers.length > 0 ? (
                  doc.covers.map((coverId) => (
                    <span key={coverId} style={{ marginRight: 6 }}>
                      <Link href={`/doc/${coverId}`}>{coverId}</Link>
                    </span>
                  ))
                ) : (
                  "—"
                )}
              </dd>
              <dt>supports</dt>
              <dd>
                {doc.supports.length > 0 ? (
                  doc.supports.map((supportId) => (
                    <span key={supportId} style={{ marginRight: 6 }}>
                      <Link href={`/doc/${supportId}`}>{supportId}</Link>
                    </span>
                  ))
                ) : (
                  "—"
                )}
              </dd>
              <dt>applies_to</dt>
              <dd>
                {doc.appliesTo.length > 0 ? (
                  doc.appliesTo.map((applyId) => (
                    <span key={applyId} style={{ marginRight: 6 }}>
                      <Link href={`/doc/${applyId}`}>{applyId}</Link>
                    </span>
                  ))
                ) : (
                  "—"
                )}
              </dd>
            </dl>
          </div>

          {supersededBy.length > 0 ? (
            <div className="card">
              <h2 style={{ marginTop: 0 }}>この decision を置き換えた decision</h2>
              <ul className="plain-list">
                {supersededBy.map((item) => (
                  <li key={item.id}>
                    <Link href={`/doc/${item.id}`}>{item.title}</Link>
                    <div className="tiny muted mono">{item.id}</div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="card">
            <h2 style={{ marginTop: 0 }}>鮮度</h2>
            <p className="small" style={{ marginTop: 0 }}>
              {doc.type === "evidence"
                ? expired
                  ? `有効期限 ${doc.expires} を過ぎています。過去の届出として残っていること自体は正常ですが、有効な証跡が別にない場合は要件が鮮度切れになります。`
                  : `有効期限 ${doc.expires ?? "なし"}。現在有効な証跡です。`
                : doc.staleAfter
                  ? stale
                    ? `stale_after ${doc.staleAfter} を過ぎています。`
                    : `stale_after ${doc.staleAfter}。現在は鮮度内です。`
                  : "stale_after の指定はありません。"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
