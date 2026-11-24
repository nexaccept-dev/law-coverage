import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { buildBundleData, todayString, toDateString } from "./engine";
import type { BundleData, Doc, DocType, FormatIssue } from "./types";

function asString(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number") return String(value);
  return undefined;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter((item): item is string => Boolean(item));
  }
  const single = asString(value);
  return single ? [single] : [];
}

export function resolveBundleSource(): { dir: string; kind: string } {
  const configured = process.env.BUNDLE_DIR?.trim();
  if (!configured) {
    return {
      dir: path.join(process.cwd(), "bundle"),
      kind: "同梱サンプル",
    };
  }
  return {
    dir: path.isAbsolute(configured)
      ? configured
      : path.resolve(process.cwd(), configured),
    kind: "指定リポジトリ",
  };
}

function normalizeDoc(
  fileName: string,
  data: Record<string, unknown>,
  body: string,
): Doc {
  return {
    id: asString(data.id) ?? "",
    type: (asString(data.type) ?? "") as DocType,
    title: asString(data.title) ?? "",
    domain: asString(data.domain) ?? "",
    verified: toDateString(data.verified),
    staleAfter: toDateString(data.stale_after),
    source: asString(data.source),
    sourceUrl: asString(data.source_url),
    covers: asStringArray(data.covers),
    supports: asStringArray(data.supports),
    expires: toDateString(data.expires),
    appliesTo: asStringArray(data.applies_to),
    status: asString(data.status),
    supersedes: asString(data.supersedes),
    body: body.trim(),
    file: fileName,
  };
}

export function loadBundle(): BundleData {
  const { dir, kind } = resolveBundleSource();

  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error(
      `バンドルディレクトリが見つかりません: ${dir}（BUNDLE_DIR を確認してください）`,
    );
  }

  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .sort();

  const docs: Doc[] = [];
  const parseIssues: FormatIssue[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    try {
      const raw = fs.readFileSync(fullPath, "utf8");
      const parsed = matter(raw);
      const doc = normalizeDoc(
        file,
        parsed.data as Record<string, unknown>,
        parsed.content,
      );
      if (!doc.id) {
        parseIssues.push({
          file,
          message: "必須項目 id がありません。ファイルを読み飛ばしました。",
        });
        continue;
      }
      if (!doc.type) {
        parseIssues.push({
          file,
          id: doc.id,
          message: "必須項目 type がありません。",
        });
      }
      docs.push(doc);
    } catch (error) {
      parseIssues.push({
        file,
        message: `frontmatter の解析に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }

  return buildBundleData({
    docs,
    today: todayString(),
    bundleDir: kind === "bundled" ? "bundle/（同梱サンプル）" : dir,
    sourceKind: kind,
    parseIssues,
  });
}
