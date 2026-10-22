export type GrowthCheckRubricFindingStatus = "pass" | "fail" | "warning" | "unknown";
export type GrowthCheckFindingConfidence = "high" | "medium" | "low";
export type GrowthCheckScanStatus = "queued" | "running" | "completed" | "failed";
export type GrowthCheckCheckVisibility = "public" | "private_ops";
export type GrowthCheckCheckMethod = "http_fetch" | "static";

export interface GrowthCheckAreaProgress {
  areaId: string;
  completedChecks: number;
  totalChecks: number;
}

export interface GrowthCheckScanProgress {
  rubricId: string;
  rubricVersion: string;
  areasCompleted: number;
  totalAreas: number;
  currentAreaId: string | null;
  areas: GrowthCheckAreaProgress[];
}

export interface GrowthCheckFindingRecord {
  checkId: string;
  areaId: string;
  sourceUrl: string;
  observedAt: string;
  status: GrowthCheckRubricFindingStatus;
  confidence: GrowthCheckFindingConfidence;
  summary: string;
}

export interface GrowthCheckRubricCheckDefinition {
  id: string;
  label: string;
  visibility: GrowthCheckCheckVisibility;
  method: GrowthCheckCheckMethod;
  /** Relative path on the scan target origin, when method is http_fetch. */
  path?: string;
  /** Signal id evaluated by the worker for public http_fetch checks. */
  signalId?: string;
}

export interface GrowthCheckRubricAreaDefinition {
  id: string;
  label: string;
  checks: GrowthCheckRubricCheckDefinition[];
}

export interface GrowthCheckRubricDefinition {
  id: string;
  version: string;
  trade: string;
  areas: GrowthCheckRubricAreaDefinition[];
}

export const GROWTH_QUEUE_JOB_NAMES = {
  publicScan: "growth-check-public-scan"
} as const;

export interface GrowthCheckPublicScanJobData {
  companyId: string;
  scanId: string;
  targetUrl: string;
  rubricId: string;
  rubricVersion: string;
  idempotencyKey: string;
  requestedByUserId: string | null;
}

export interface EnqueueGrowthCheckPublicScanInput {
  targetUrl: string;
  rubricId?: string;
  idempotencyKey?: string;
}

export function buildGrowthCheckScanProgress(rubric: GrowthCheckRubricDefinition): GrowthCheckScanProgress {
  return {
    rubricId: rubric.id,
    rubricVersion: rubric.version,
    areasCompleted: 0,
    totalAreas: rubric.areas.length,
    currentAreaId: rubric.areas[0]?.id ?? null,
    areas: rubric.areas.map((area) => ({
      areaId: area.id,
      completedChecks: 0,
      totalChecks: area.checks.length
    }))
  };
}

export function growthCheckPublicScanJobId(companyId: string, idempotencyKey: string): string {
  return `growth-check-public-scan:${companyId}:${idempotencyKey}`;
}
