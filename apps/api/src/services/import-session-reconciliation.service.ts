import { createSignedDownloadUrl } from "@fsm/config/storage";
import { and, eq, isNull } from "drizzle-orm";

import { db, importSessions } from "@fsm/db";
import {
  AppError,
  ErrorCode,
  type ImportSessionReconciliationResponse
} from "@fsm/types";

import { readImportReconciliationReportFromAiInferences } from "../lib/import-reconciliation.js";

export async function getImportSessionReconciliation(
  companyId: string,
  importSessionId: string
): Promise<ImportSessionReconciliationResponse> {
  const [session] = await db
    .select()
    .from(importSessions)
    .where(
      and(
        eq(importSessions.companyId, companyId),
        eq(importSessions.id, importSessionId),
        isNull(importSessions.deletedAt)
      )
    )
    .limit(1);

  if (!session) {
    throw new AppError(ErrorCode.NOT_FOUND, "Import session not found");
  }

  const report = readImportReconciliationReportFromAiInferences(session.aiInferences);

  if (!report) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      "Reconciliation report is not available for this import session yet"
    );
  }

  let skippedRowsDownloadUrl: string | null = null;

  if (report.skippedRowsCsvObjectKey) {
    const signed = await createSignedDownloadUrl(report.skippedRowsCsvObjectKey);
    skippedRowsDownloadUrl = signed.url;
  }

  return {
    report,
    skippedRowsDownloadUrl
  };
}
