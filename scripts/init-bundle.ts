import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import matter from "gray-matter";

interface Args {
  out: string;
  force: boolean;
}

function printUsage(): void {
  console.log(
    [
      "使い方: npm run init-bundle -- --out <dir> [--force]",
      "",
      "  --out <dir>  初期化先のディレクトリ",
      "  --force      既存ディレクトリの中身があっても上書きする",
    ].join("\n"),
  );
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv: string[]): Args {
  let out = "";
  let force = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--force" || arg === "-f") {
      force = true;
    } else if (arg === "--out" || arg === "-o") {
      const value = argv[i + 1];
      if (!value) fail("--out にはディレクトリを指定してください。");
      out = value;
      i += 1;
    } else if (arg.startsWith("--out=")) {
      out = arg.slice("--out=".length);
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else {
      fail(`不明な引数です: ${arg}`);
    }
  }

  if (!out) {
    printUsage();
    fail("--out <dir> は必須です。");
  }

  return { out, force };
}

function readmeText(lawCount: number): string {
  return `法令カバレッジ・バンドル初期化済み
================================

このディレクトリには、ひな形バンドルから抽出した法令ファイル（type: law）${lawCount} 件が入っています。
法令ファイルはライブラリとして扱い、編集しないでください（エージェントも編集禁止）。

次の手順
--------
1. 調査対象システムの規程・就業規則・手順・マニュアル・証跡を集める。
2. 1条項／1設定群につき1ファイルの Markdown を作り、このディレクトリに置く。
   - ファイル名は任意（例: rule-001.md, proc-attendance.md）。
   - 先頭に YAML frontmatter を必ず付ける。
3. 対象システムのパスとこのバンドルのパスをエージェントに伝え、AGENT-INSTRUCTIONS.md の手順で調査・文書化させる。
4. npm run check -- --bundle <このディレクトリ> で検証する。

社内文書の frontmatter（必須項目）
--------------------------------
共通: id / type / title / domain / verified
- rule / procedure / manual:
    type: rule（または procedure / manual）
    covers: ["law-lsa-001"]   # 対応する law の id。推測で付けない。
- evidence:
    type: evidence
    supports: ["law-lsa-007", "rule-model-021"]  # law または rule の id
    expires: 2027-03-31       # 有効期限（任意）
- decision:
    type: decision
    applies_to: ["law-lsa-015"]
    status: accepted          # accepted / superseded
  decision で適用除外にする場合は、本文に適用除外の理由を必ず書く。

例:
---
id: rule-attendance-001
type: rule
title: "勤務時間の定め"
domain: "労働時間"
verified: 2026-11-24
covers: ["law-lsa-001"]
---
# 勤務時間の定め
根拠: 対象システムの設定ファイル config/attendance.yml の workdayHours（8時間）と、
管理画面「勤務設定」の始業・終業時刻。就業規則 第20条。

調査時の注意
------------
- 根拠（対象システムのどのファイル・設定・画面・条項か）を本文に必ず書く。
- 根拠が曖昧なものは covers を付けず、未対応のまま理由を本文にメモする。
- 証跡は実在する届出・記録だけを書く。捏造しない。
- 法律解釈を断定しない。判断は decision に人が記録する。
- 充足率を良く見せるために法令ファイルやチェッカーを改変しない。

エージェントへの指示例
----------------------
「/home/user/attendance-system を調査し、このバンドルに社内文書を追加してください。
AGENT-INSTRUCTIONS.md に従い、1条項／1設定群＝1ファイルで文書化し、
npm run check -- --bundle . --json で形式エラーが0件になるまで直してください。
根拠が取れない要件は covers を付けず、理由を本文にメモしてください。」

参考
----
- エージェント向け詳細手順: リポジトリ直下の AGENT-INSTRUCTIONS.md
- データ形式と判定ロジック: リポジトリ直下の SPEC.md
`;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const sourceDir = path.join(process.cwd(), "bundle");
  const outDir = path.resolve(process.cwd(), args.out);

  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    fail(`既定バンドルが見つかりません: ${sourceDir}`);
  }

  if (fs.existsSync(outDir)) {
    if (!fs.statSync(outDir).isDirectory()) {
      fail(`--out のパスがディレクトリではありません: ${outDir}`);
    }
    const entries = fs.readdirSync(outDir);
    if (entries.length > 0 && !args.force) {
      fail(
        `出力先が空ではありません: ${outDir}\n上書きする場合は --force を付けてください。`,
      );
    }
  } else {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const lawFiles: string[] = [];
  const files = fs
    .readdirSync(sourceDir)
    .filter((file) => file.endsWith(".md"))
    .sort();

  for (const file of files) {
    const fullPath = path.join(sourceDir, file);
    const raw = fs.readFileSync(fullPath, "utf8");
    let type: unknown;
    try {
      type = matter(raw).data.type;
    } catch (error) {
      fail(
        `frontmatter の解析に失敗しました: ${file}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    if (type === "law") {
      lawFiles.push(file);
    }
  }

  for (const file of lawFiles) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(outDir, file));
  }

  fs.writeFileSync(path.join(outDir, "README.txt"), readmeText(lawFiles.length));

  console.log(`バンドルを初期化しました: ${outDir}`);
  console.log(`type: law のファイル: ${lawFiles.length} 件`);
  console.log("README.txt を配置しました。");
}

try {
  main();
} catch (error) {
  fail(
    `初期化に失敗しました: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}
