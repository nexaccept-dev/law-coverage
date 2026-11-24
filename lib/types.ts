export const DOC_TYPES = [
  "law",
  "rule",
  "procedure",
  "manual",
  "decision",
  "evidence",
] as const;

export type DocType = (typeof DOC_TYPES)[number];

export interface Doc {
  id: string;
  type: DocType;
  title: string;
  domain: string;
  verified?: string;
  staleAfter?: string;
  source?: string;
  sourceUrl?: string;
  covers: string[];
  supports: string[];
  expires?: string;
  appliesTo: string[];
  status?: string;
  supersedes?: string;
  body: string;
  file: string;
}

export type CoverageStatus =
  | "excluded"
  | "missing"
  | "stale"
  | "no_procedure"
  | "no_rule"
  | "no_evidence"
  | "covered";

export const STATUS_META: Record<
  CoverageStatus,
  {
    label: string;
    tone: string;
    priority: number;
    gapOrder: number;
    description: string;
  }
> = {
  covered: {
    label: "対応済み",
    tone: "green",
    priority: 7,
    gapOrder: 6,
    description: "規則・手順・証跡が揃い、鮮度も保たれている",
  },
  missing: {
    label: "未対応",
    tone: "red",
    priority: 2,
    gapOrder: 0,
    description: "covers する規則・手順・マニュアルがない",
  },
  stale: {
    label: "鮮度切れ",
    tone: "orange",
    priority: 3,
    gapOrder: 1,
    description: "紐づく文書の stale_after 超過、または有効な証跡がない",
  },
  no_procedure: {
    label: "手順なし",
    tone: "yellow",
    priority: 4,
    gapOrder: 3,
    description: "規則はあるが、手順・マニュアルがない",
  },
  no_rule: {
    label: "根拠なし",
    tone: "yellow",
    priority: 5,
    gapOrder: 2,
    description: "手順・マニュアルはあるが、根拠となる規則がない",
  },
  no_evidence: {
    label: "証跡なし",
    tone: "yellow",
    priority: 6,
    gapOrder: 4,
    description: "規則と手順はあるが、証跡がない",
  },
  excluded: {
    label: "適用外",
    tone: "gray",
    priority: 1,
    gapOrder: 5,
    description: "accepted の decision に適用除外の理由が記録されている",
  },
};

export const STATUS_ORDER: CoverageStatus[] = [
  "covered",
  "missing",
  "stale",
  "no_procedure",
  "no_rule",
  "no_evidence",
  "excluded",
];

export const TYPE_LABELS: Record<DocType, string> = {
  law: "要件",
  rule: "規則",
  procedure: "手順",
  manual: "マニュアル",
  decision: "意思決定（ADR）",
  evidence: "証跡",
};

export interface LawResult {
  law: Doc;
  status: CoverageStatus;
  reason: string;
  rules: Doc[];
  procedures: Doc[];
  manuals: Doc[];
  evidences: Doc[];
  validEvidences: Doc[];
  expiredEvidences: Doc[];
  staleDocuments: Doc[];
  decisions: Doc[];
  exclusionDecision?: Doc;
}

export interface FormatIssue {
  file: string;
  id?: string;
  message: string;
}

export interface DuplicateBias {
  lawId: string;
  lawTitle: string;
  rules: Doc[];
  procedures: Doc[];
  manuals: Doc[];
}

export interface DomainSummary {
  domain: string;
  total: number;
  excluded: number;
  covered: number;
  gaps: number;
  denominator: number;
  rate: number;
}

export interface Diagnostics {
  formatIssues: FormatIssue[];
  orphanDocs: Doc[];
  duplicateBiases: DuplicateBias[];
  freshDocs: Doc[];
  staleOrExpiredDocs: Doc[];
  freshnessCandidates: Doc[];
  freshnessRate: number;
  coveredLaws: LawResult[];
  lawsWithDecisions: LawResult[];
}

export interface BundleData {
  docs: Doc[];
  laws: Doc[];
  lawResults: LawResult[];
  lawResultById: Record<string, LawResult>;
  byId: Record<string, Doc>;
  decisions: Doc[];
  diagnostics: Diagnostics;
  statusCounts: Record<CoverageStatus, number>;
  domains: DomainSummary[];
  coverageRate: number;
  today: string;
  bundleDir: string;
  sourceKind: string;
}

export function statusLabel(status: CoverageStatus): string {
  return STATUS_META[status].label;
}

export function typeLabel(type: DocType): string {
  return TYPE_LABELS[type];
}

export function isLawType(type: DocType): boolean {
  return type === "law";
}
