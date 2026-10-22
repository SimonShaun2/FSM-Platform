import { and, eq, isNull } from "drizzle-orm";

import {
  DATA_EXPORT_MANIFEST_V1,
  DATA_EXPORT_MANIFEST_VERSION,
  DATA_EXPORT_RETENTION_DAYS,
  AppError,
  ErrorCode,
  EXPORT_QUEUE_JOB_NAMES,
  type CreateDataExportBody,
  type DataExportFormat,
  type TenantDataExportJobData
} from "@fsm/types";
import { dataExportSessions, db, emitEvent } from "@fsm/db";
import { exportsQueue } from "@fsm/jobs";

type DataExportSessionRow = typeof dataExportSessions.$inferSelect;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function addRetentionDays(base: Date, days: number): Date {
  const copy = new Date(base.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function normalizeRecordCounts(value: unknown): Record<string, number> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const counts: Record<string, number> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "number" && Number.isFinite(entry) && entry >= 0) {
      counts[key] = Math.trunc(entry);
    }
  }
  return counts;
}

function assertNotExpired(session: DataExportSessionRow): void {
  if (session.status !== "expired" && session.expiresAt && session.expiresAt.getTime() < Date.now()) {
    throw new AppError(ErrorCode.NOT_FOUND, "Export is no longer available");
  }
}

async function getScopedSession(companyId: string, exportSessionId: string): Promise<DataExportSessionRow> {
  const [session] = await db
    .select()
    .from(dataExportSessions)
    .where(
      and(
        eq(dataExportSessions.id, exportSessionId),
        eq(dataExportSessions.companyId, companyId),
        isNull(dataExportSessions.deletedAt)
      )
    )
    .limit(1);

  if (!session) {
    throw new AppError(ErrorCode.NOT_FOUND, "Export session not found");
  }

  return session;
}

function buildExportFileName(exportSessionId: string, format: DataExportFormat): string {
  const extension = format === "csv_bundle" ? "json" : "json";
  return `tenant-export-${exportSessionId}.${extension}`;
}

export function getDataExportManifest() {
  return DATA_EXPORT_MANIFEST_V1;
}

export async function createDataExportSession(
  companyId: string,
  requestedById: string,
  input: CreateDataExportBody
): Promise<DataExportSessionRow> {
  const format = input.format ?? "json";
  const expiresAt = addRetentionDays(new Date(), DATA_EXPORT_RETENTION_DAYS);

  const [session] = await db
    .insert(dataExportSessions)
    .values({
      companyId,
      requestedById,
      status: "pending",
      format,
      manifestVersion: DATA_EXPORT_MANIFEST_VERSION,
      progressPercent: 0,
      expiresAt,
      recordCounts: {}
    })
    .returning();

  await emitEvent({
    companyId,
    actorId: requestedById,
    actorType: "user",
    eventType: "export.requested",
    entityType: "data_export_session",
    entityId: session.id,
    payload: {
      format,
      manifestVersion: DATA_EXPORT_MANIFEST_VERSION
    },
    summary: "Organization data export requested"
  });

  const jobData: TenantDataExportJobData = {
    companyId,
    exportSessionId: session.id,
    requestedById
  };

  await exportsQueue.add(EXPORT_QUEUE_JOB_NAMES.tenantDataExport, jobData, {
    jobId: `tenant-export:${session.id}`,
    removeOnComplete: true,
    removeOnFail: false
  });

  return session;
}

export async function listDataExportSessions(
  companyId: string,
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT
): Promise<{ data: DataExportSessionRow[]; total: number; page: number; limit: number }> {
  const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const safePage = Math.max(page, 1);
  const offset = (safePage - 1) * safeLimit;

  const rows = await db
    .select()
    .from(dataExportSessions)
    .where(and(eq(dataExportSessions.companyId, companyId), isNull(dataExportSessions.deletedAt)));

  const sortedRows = [...rows].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  const startIndex = (safePage - 1) * safeLimit;

  return {
    data: sortedRows.slice(startIndex, startIndex + safeLimit),
    total: sortedRows.length,
    page: safePage,
    limit: safeLimit
  };
}

export async function getDataExportSession(
  companyId: string,
  exportSessionId: string
): Promise<DataExportSessionRow> {
  return getScopedSession(companyId, exportSessionId);
}

export async function retryDataExportSession(
  companyId: string,
  requestedById: string,
  exportSessionId: string
): Promise<DataExportSessionRow> {
  const session = await getScopedSession(companyId, exportSessionId);

  if (session.status !== "failed") {
    throw new AppError(ErrorCode.CONFLICT, "Only failed exports can be retried");
  }

  if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
    throw new AppError(ErrorCode.CONFLICT, "Export retention window has passed");
  }

  const [updated] = await db
    .update(dataExportSessions)
    .set({
      status: "pending",
      progressPercent: 0,
      errorMessage: null,
      updatedAt: new Date()
    })
    .where(eq(dataExportSessions.id, session.id))
    .returning();

  const jobData: TenantDataExportJobData = {
    companyId,
    exportSessionId: session.id,
    requestedById
  };

  await exportsQueue.add(EXPORT_QUEUE_JOB_NAMES.tenantDataExport, jobData, {
    jobId: `tenant-export:${session.id}`,
    removeOnComplete: true,
    removeOnFail: false
  });

  return updated;
}

export async function recordDataExportDownload(
  companyId: string,
  actorId: string,
  exportSessionId: string
): Promise<DataExportSessionRow> {
  const session = await getScopedSession(companyId, exportSessionId);
  assertNotExpired(session);

  if (session.status !== "completed" || !session.fileUrl) {
    throw new AppError(ErrorCode.CONFLICT, "Export is not ready for download");
  }

  await emitEvent({
    companyId,
    actorId,
    actorType: "user",
    eventType: "export.downloaded",
    entityType: "data_export_session",
    entityId: session.id,
    payload: {
      fileName: session.fileName
    },
    summary: "Organization data export downloaded"
  });

  return session;
}

export function toDataExportSessionResponse(session: DataExportSessionRow) {
  return {
    id: session.id,
    status: session.status,
    format: session.format,
    manifestVersion: session.manifestVersion as typeof DATA_EXPORT_MANIFEST_VERSION,
    progressPercent: session.progressPercent,
    fileName: session.fileName,
    fileUrl: session.status === "completed" ? session.fileUrl : null,
    recordCounts: normalizeRecordCounts(session.recordCounts),
    expiresAt: session.expiresAt?.toISOString() ?? null,
    completedAt: session.completedAt?.toISOString() ?? null,
    errorMessage: session.errorMessage ?? null,
    createdAt: session.createdAt.toISOString()
  };
}

export { buildExportFileName };
