import type {
  BundleData,
  CoverageStatus,
  Diagnostics,
  Doc,
  DocType,
  DomainSummary,
  DuplicateBias,
  FormatIssue,
  LawResult,
} from "./types";
import { DOC_TYPES, STATUS_ORDER } from "./types";

const EXCLUSION_REASON_PATTERN =
  /適用除外|適用しない|適用外|対象外|対象者がいない|対象者が存在しない|対象となる労働者が存在しない|対象となる労働者がいない/;

export function toDateString(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined;
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "string") {
    const match = value.trim().match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : value.trim() || undefined;
  }
  if (typeof value === "number") {
    return toDateString(new Date(value));
  }
  return undefined;
}

export function todayString(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isPastDate(value: string | undefined, today: string): boolean {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && value < today);
}

export function isExpired(doc: Doc, today: string): boolean {
  return doc.type === "evidence" && isPastDate(doc.expires, today);
}

export function isStale(doc: Doc, today: string): boolean {
  if (doc.type === "evidence") return isExpired(doc, today);
  return isPastDate(doc.staleAfter, today);
}

export function hasExclusionReason(body: string): boolean {
  return EXCLUSION_REASON_PATTERN.test(body);
}

export function typeIsValid(type: string): type is DocType {
  return (DOC_TYPES as readonly string[]).includes(type);
}

function ids(docs: Doc[]): string {
  return docs.map((d) => d.id).join("、");
}

export function computeLawResult(
  law: Doc,
  docs: Doc[],
  decisions: Doc[],
  today: string,
): LawResult {
  const rules = docs.filter(
    (d) => d.type === "rule" && d.covers.includes(law.id),
  );
  const procedures = docs.filter(
    (d) => d.type === "procedure" && d.covers.includes(law.id),
  );
  const manuals = docs.filter(
    (d) => d.type === "manual" && d.covers.includes(law.id),
  );
  const ruleIds = new Set(rules.map((d) => d.id));
  const evidences = docs.filter(
    (d) =>
      d.type === "evidence" &&
      (d.supports.includes(law.id) ||
        d.supports.some((supportedId) => ruleIds.has(supportedId))),
  );
  const validEvidences = evidences.filter((d) => !isExpired(d, today));
  const expiredEvidences = evidences.filter((d) => isExpired(d, today));
  const linkedDocs = [...rules, ...procedures, ...manuals];
  const staleDocuments = linkedDocs.filter((d) => isStale(d, today));
  const lawDecisions = decisions.filter(
    (d) =>
      d.type === "decision" &&
      d.status === "accepted" &&
      d.appliesTo.includes(law.id),
  );
  const exclusionDecision = lawDecisions.find((d) =>
    hasExclusionReason(d.body),
  );
  const evidenceAllExpired =
    evidences.length > 0 && validEvidences.length === 0;

  let status: CoverageStatus;
  if (exclusionDecision) {
    status = "excluded";
  } else if (rules.length === 0 && procedures.length === 0 && manuals.length === 0) {
    status = "missing";
  } else if (staleDocuments.length > 0 || evidenceAllExpired) {
    status = "stale";
  } else if (rules.length > 0 && procedures.length === 0 && manuals.length === 0) {
    status = "no_procedure";
  } else if (
    (procedures.length > 0 || manuals.length > 0) &&
    rules.length === 0
  ) {
    status = "no_rule";
  } else if (rules.length > 0 && evidences.length === 0) {
    status = "no_evidence";
  } else {
    status = "covered";
  }

  const reason = buildReason({
    status,
    rules,
    procedures,
    manuals,
    evidences,
    validEvidences,
    expiredEvidences,
    staleDocuments,
    exclusionDecision,
    evidenceAllExpired,
  });

  return {
    law,
    status,
    reason,
    rules,
    procedures,
    manuals,
    evidences,
    validEvidences,
    expiredEvidences,
    staleDocuments,
    decisions: lawDecisions,
    exclusionDecision,
  };
}

function buildReason(input: {
  status: CoverageStatus;
  rules: Doc[];
  procedures: Doc[];
  manuals: Doc[];
  evidences: Doc[];
  validEvidences: Doc[];
  expiredEvidences: Doc[];
  staleDocuments: Doc[];
  exclusionDecision?: Doc;
  evidenceAllExpired: boolean;
}): string {
  const {
    status,
    rules,
    procedures,
    manuals,
    validEvidences,
    expiredEvidences,
    staleDocuments,
    exclusionDecision,
    evidenceAllExpired,
  } = input;

  switch (status) {
    case "excluded":
      return `decision ${exclusionDecision?.id ?? ""}（${
        exclusionDecision?.title ?? ""
      }）で適用除外の判断と理由が記録されています。`;
    case "missing":
      return "covers にこの要件を指す規則・手順・マニュアルがありません。";
    case "stale": {
      const parts: string[] = [];
      if (staleDocuments.length > 0) {
        parts.push(
          `stale_after を過ぎた文書: ${staleDocuments
            .map((d) => `${d.id}（${d.staleAfter}）`)
            .join("、")}`,
        );
      }
      if (evidenceAllExpired) {
        parts.push(
          `有効な証跡がなく、期限切れの証跡のみです: ${expiredEvidences
            .map((d) => `${d.id}（expires ${d.expires}）`)
            .join("、")}`,
        );
      }
      return parts.join("。") + "。";
    }
    case "no_procedure":
      return `規則（${ids(rules)}）はありますが、手順・マニュアルがありません。`;
    case "no_rule":
      return `手順・マニュアル（${ids([
        ...procedures,
        ...manuals,
      ])}）はありますが、根拠となる規則がありません。`;
    case "no_evidence":
      return `規則（${ids(rules)}）と手順・マニュアル（${ids([
        ...procedures,
        ...manuals,
      ])}）はありますが、証跡がありません。`;
    case "covered":
      return `規則・手順・証跡が揃い、鮮度も保たれています${
        validEvidences.length > 0
          ? `（有効な証跡: ${ids(validEvidences)}）`
          : ""
      }。`;
    default:
      return "";
  }
}

export function buildStatusCounts(
  results: LawResult[],
): Record<CoverageStatus, number> {
  const counts = Object.fromEntries(
    STATUS_ORDER.map((s) => [s, 0]),
  ) as Record<CoverageStatus, number>;
  for (const result of results) counts[result.status] += 1;
  return counts;
}

export function buildDomainSummaries(results: LawResult[]): DomainSummary[] {
  const domains = new Map<string, DomainSummary>();
  for (const result of results) {
    const domain = result.law.domain || "未分類";
    let summary = domains.get(domain);
    if (!summary) {
      summary = {
        domain,
        total: 0,
        excluded: 0,
        covered: 0,
        gaps: 0,
        denominator: 0,
        rate: 0,
      };
      domains.set(domain, summary);
    }
    summary.total += 1;
    if (result.status === "excluded") summary.excluded += 1;
    if (result.status === "covered") summary.covered += 1;
  }
  return [...domains.values()].map((summary) => {
    const denominator = summary.total - summary.excluded;
    const gaps = denominator - summary.covered;
    return {
      ...summary,
      denominator,
      gaps,
      rate: denominator > 0 ? (summary.covered / denominator) * 100 : 0,
    };
  });
}

export function buildBundleData(input: {
  docs: Doc[];
  today: string;
  bundleDir: string;
  sourceKind: string;
  parseIssues?: FormatIssue[];
}): BundleData {
  const docs = [...input.docs].sort((a, b) => a.id.localeCompare(b.id));
  const byId: Record<string, Doc> = {};
  for (const doc of docs) byId[doc.id] = doc;

  const laws = docs.filter((d) => d.type === "law");
  const decisions = docs.filter((d) => d.type === "decision");
  const lawResults = laws.map((law) =>
    computeLawResult(law, docs, decisions, input.today),
  );
  const lawResultById: Record<string, LawResult> = {};
  for (const result of lawResults) lawResultById[result.law.id] = result;

  const statusCounts = buildStatusCounts(lawResults);
  const domains = buildDomainSummaries(lawResults);
  const denominator = statusCounts.covered + statusCounts.missing +
    statusCounts.stale + statusCounts.no_procedure + statusCounts.no_rule +
    statusCounts.no_evidence;
  const coverageRate =
    denominator > 0 ? (statusCounts.covered / denominator) * 100 : 0;

  const diagnostics = buildDiagnostics(
    docs,
    byId,
    lawResults,
    input.today,
    input.parseIssues ?? [],
  );

  return {
    docs,
    laws,
    lawResults,
    lawResultById,
    byId,
    decisions,
    diagnostics,
    statusCounts,
    domains,
    coverageRate,
    today: input.today,
    bundleDir: input.bundleDir,
    sourceKind: input.sourceKind,
  };
}

function buildDiagnostics(
  docs: Doc[],
  byId: Record<string, Doc>,
  lawResults: LawResult[],
  today: string,
  parseIssues: FormatIssue[],
): Diagnostics {
  const formatIssues: FormatIssue[] = [...parseIssues];
  const seenIds = new Set<string>();

  for (const doc of docs) {
    if (seenIds.has(doc.id)) {
      formatIssues.push({
        file: doc.file,
        id: doc.id,
        message: `id が重複しています: ${doc.id}`,
      });
    }
    seenIds.add(doc.id);

    if (!doc.id) {
      formatIssues.push({ file: doc.file, message: "必須項目 id がありません。" });
    }
    if (!doc.type) {
      formatIssues.push({
        file: doc.file,
        id: doc.id,
        message: "必須項目 type がありません。",
      });
    } else if (!typeIsValid(doc.type)) {
      formatIssues.push({
        file: doc.file,
        id: doc.id,
        message: `type が不正です: ${doc.type}`,
      });
    }
    if (!doc.title) {
      formatIssues.push({
        file: doc.file,
        id: doc.id,
        message: "必須項目 title がありません。",
      });
    }
    if (!doc.domain) {
      formatIssues.push({
        file: doc.file,
        id: doc.id,
        message: "必須項目 domain がありません。",
      });
    }
    if (!doc.verified) {
      formatIssues.push({
        file: doc.file,
        id: doc.id,
        message: "必須項目 verified がありません。",
      });
    }

    if (doc.type === "law" && !doc.source) {
      formatIssues.push({
        file: doc.file,
        id: doc.id,
        message: "law に source がありません。",
      });
    }
    if (doc.type === "decision" && !["accepted", "superseded"].includes(doc.status ?? "")) {
      formatIssues.push({
        file: doc.file,
        id: doc.id,
        message: `decision の status が不正です: ${doc.status ?? "（未設定）"}`,
      });
    }

    for (const coverId of doc.covers) {
      const target = byId[coverId];
      if (!target) {
        formatIssues.push({
          file: doc.file,
          id: doc.id,
          message: `covers の参照切れ: ${coverId}`,
        });
      } else if (target.type !== "law") {
        formatIssues.push({
          file: doc.file,
          id: doc.id,
          message: `covers の参照先が law ではありません: ${coverId}（${target.type}）`,
        });
      }
    }

    for (const supportId of doc.supports) {
      const target = byId[supportId];
      if (!target) {
        formatIssues.push({
          file: doc.file,
          id: doc.id,
          message: `supports の参照切れ: ${supportId}`,
        });
      } else if (target.type !== "law" && target.type !== "rule") {
        formatIssues.push({
          file: doc.file,
          id: doc.id,
          message: `supports の参照先が law/rule ではありません: ${supportId}（${target.type}）`,
        });
      }
    }

    for (const appliedId of doc.appliesTo) {
      if (!byId[appliedId]) {
        formatIssues.push({
          file: doc.file,
          id: doc.id,
          message: `applies_to の参照切れ: ${appliedId}`,
        });
      }
    }

    if (doc.supersedes && !byId[doc.supersedes]) {
      formatIssues.push({
        file: doc.file,
        id: doc.id,
        message: `supersedes の参照切れ: ${doc.supersedes}`,
      });
    }
  }

  const orphanDocs = docs.filter(
    (doc) =>
      (doc.type === "rule" ||
        doc.type === "procedure" ||
        doc.type === "manual") &&
      !doc.covers.some((coverId) => byId[coverId]?.type === "law"),
  );

  const duplicateBiases: DuplicateBias[] = lawResults
    .map((result) => ({
      lawId: result.law.id,
      lawTitle: result.law.title,
      rules: result.rules,
      procedures: result.procedures,
      manuals: result.manuals,
    }))
    .filter(
      (bias) =>
        bias.rules.length > 1 ||
        bias.procedures.length > 1 ||
        bias.manuals.length > 1,
    );

  const freshnessCandidates = docs.filter((doc) =>
    ["rule", "procedure", "manual", "evidence"].includes(doc.type),
  );
  const staleOrExpiredDocs = freshnessCandidates.filter((doc) =>
    isStale(doc, today),
  );
  const freshDocs = freshnessCandidates.filter(
    (doc) => !isStale(doc, today),
  );

  return {
    formatIssues,
    orphanDocs,
    duplicateBiases,
    freshDocs,
    staleOrExpiredDocs,
    freshnessCandidates,
    freshnessRate:
      freshnessCandidates.length > 0
        ? (freshDocs.length / freshnessCandidates.length) * 100
        : 100,
    coveredLaws: lawResults.filter((result) => result.status === "covered"),
    lawsWithDecisions: lawResults.filter(
      (result) => result.decisions.length > 0,
    ),
  };
}

export function compareGapResults(a: LawResult, b: LawResult): number {
  const order =
    gapOrder(a.status) - gapOrder(b.status) ||
    a.law.id.localeCompare(b.law.id);
  return order;
}

function gapOrder(status: CoverageStatus): number {
  const order: Record<CoverageStatus, number> = {
    missing: 0,
    stale: 1,
    no_rule: 2,
    no_procedure: 3,
    no_evidence: 4,
    excluded: 5,
    covered: 6,
  };
  return order[status];
}

export function docsToShow(result: LawResult): Doc[] {
  return [
    ...result.rules,
    ...result.procedures,
    ...result.manuals,
    ...result.evidences,
  ];
}
