import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>ドキュメントが見つかりません</h1>
      <p className="muted">
        指定された ID は現在のバンドルに存在しません。ID の綴り、または BUNDLE_DIR
        の設定を確認してください。
      </p>
      <p>
        <Link className="filter-link" href="/">
          ダッシュボードへ戻る
        </Link>
      </p>
    </div>
  );
}
