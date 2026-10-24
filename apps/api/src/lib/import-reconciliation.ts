import {
  IMPORT_SESSION_RECONCILIATION_REPORT_KEY,
  ImportSessionReconciliationReportSchema,
  type ImportSessionReconciliationReport
} from "@fsm/types";

export function readImportReconciliationReportFromAiInferences(
  aiInferences: unknown
): ImportSessionReconciliationReport | null {
  if (typeof aiInferences !== "object" || aiInferences === null || Array.isArray(aiInferences)) {
    return null;
  }

  const raw = (aiInferences as Record<string, unknown>)[IMPORT_SESSION_RECONCILIATION_REPORT_KEY];
  const parsed = ImportSessionReconciliationReportSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
