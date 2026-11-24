# ひな形キット（法令カバレッジ）

新しい領域・新しいシステムを作るときの雛形です。

## 使い方
1. このディレクトリ一式を新しいプロジェクトにコピーする。
2. `bundle/` のサンプル文書を、自領域の法令要件（type: law）と社内文書に差し替える。
3. アプリ本体（law-coverage）の `bundle/` に置くか、環境変数 `BUNDLE_DIR` でこのディレクトリを指定して起動する。

## 文書の作り方
- 1ファイル = 1文書。Markdown + YAML frontmatter。
- 共通必須: id / type / title / domain / verified
- law: source（法令名・条番号）, source_url を追加
- rule / procedure / manual / setting: covers に対応する law の id を列挙
- setting: 設定でカバーできるものに使い、設定の場所と内容を本文に書く（DBの生値を無理に取得せず、値の機械照合はしない）
- evidence: supports に law または rule の id、必要なら expires（有効期限）
- decision: applies_to に判断対象の id、status（accepted / superseded）
- 鮮度: 古くなりやすい文書には stale_after を付ける

判定ルールとデータ形式の詳細は本体の SPEC.md を参照。
