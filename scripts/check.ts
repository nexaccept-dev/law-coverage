import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { compareGapResults } from "../lib/engine";
import { STATUS_META, STATUS_ORDER, type CoverageStatus } from "../lib/types";

interface Args {
  bundle: string;
  json: boolean;
}

function printUsage(): void {
  console.log(
    [
      "使い方: npm run check -- --bundle <dir> [--json]",
      "",
      "  --bundle <dir>  チェックする OKF バンドルのディレクトリ",
      "  --json          結果を JSON で出力する",
    ].join("\n"),
  );
}

function fail(message: string, code = 2): never {
  console.error(message);
  process.exit(code);
}

function parseArgs(argv: string[]): Args {
  let bundle = "";
  let json = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") {
      json = true;
    } else if (arg === "--bundle" || arg === "-b") {
      const value = argv[i + 1];
      if (!value) fail("--bundle にはディレクトリを指定してください。");
      bundle = value;
      i += 1;
    } else if (arg.startsWith("--bundle=")) {
      bundle = arg.slice("--bundle=".length);
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else {
      fail(`不明な引数です: ${arg}`);
    }
  }

  if (!bundle) {
    printUsage();
    fail("--bundle <dir> は必須です。");
  }

  return { bundle, json };
}

function statusText(status: CoverageStatus): string {
  return STATUS_META[status].label;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const bundleDir = path.resolve(process.cwd(), args.bundle);

  if (!fs.existsSync(bundleDir) || !fs.statSync(bundleDir).isDirectory()) {
    fail(`バンドルディレクトリが見つかりません: ${bundleDir}`, 2);
  }

  process.env.BUNDLE_DIR = bundleDir;

  const { loadBundle } = await import("../lib/bundle");
  const data = loadBundle();

  const gaps = data.lawResults
    .filter((result) => result.status !== "covered")
    .sort(compareGapResults);
  const settingCovered = data.lawResults.filter(
    (result) => result.settings.length > 0,
  );
  const formatErrors = data.diagnostics.formatIssues;

  if (args.json) {
    const payload = {
      bundle: args.bundle,
      today: data.today,
      summary: {
        total: data.laws.length,
        coverageRate: Number(data.coverageRate.toFixed(1)),
        counts: data.statusCounts,
      },
      gaps: gaps.map((result) => ({
        id: result.law.id,
        title: result.law.title,
        state: result.status,
        reason: result.reason,
      })),
      formatErrors: formatErrors.map((issue) => ({
        file: issue.file,
        message: issue.message,
      })),
      laws: data.lawResults.map((result) => ({
        id: result.law.id,
        title: result.law.title,
        domain: result.law.domain,
        state: result.status,
        reason: result.reason,
        viaSetting: result.settings.length > 0,
      })),
    };
    console.log(JSON.stringify(payload, null, 2));
  } else {
    const denominator = data.laws.length - data.statusCounts.excluded;
    console.log("法令カバレッジチェック");
    console.log(`バンドル: ${args.bundle}`);
    console.log(`判定日: ${data.today}`);
    console.log(
      `充足率: ${data.coverageRate.toFixed(1)}%（対応済み ${data.statusCounts.covered} ÷ 対象 ${denominator}）`,
    );
    console.log("状態別件数:");
    for (const status of STATUS_ORDER) {
      console.log(`  ${statusText(status)}: ${data.statusCounts[status]}`);
    }
    console.log(`設定でカバー: ${settingCovered.length}件`);

    console.log(`ギャップ (${gaps.length}件):`);
    if (gaps.length === 0) {
      console.log("  （なし）");
    } else {
      for (const result of gaps) {
        console.log(
          `  - ${result.law.id} ${result.law.title} [${statusText(result.status)}] ${result.reason}`,
        );
      }
    }

    console.log(`形式エラー (${formatErrors.length}件):`);
    if (formatErrors.length === 0) {
      console.log("  （なし）");
    } else {
      for (const issue of formatErrors) {
        console.log(`  - ${issue.file}: ${issue.message}`);
      }
    }
  }

  process.exitCode = formatErrors.length > 0 ? 1 : 0;
}

main().catch((error: unknown) => {
  fail(
    `チェックに失敗しました: ${
      error instanceof Error ? error.message : String(error)
    }`,
    2,
  );
});
