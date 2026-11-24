"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>バンドルの読み込みに失敗しました</h1>
      <p className="muted">{error.message}</p>
      <p className="small muted">
        環境変数 <code>BUNDLE_DIR</code> が Markdown
        バンドルのディレクトリを指しているか確認してください。
      </p>
      <button className="filter-link" type="button" onClick={() => reset()}>
        再試行
      </button>
    </div>
  );
}
