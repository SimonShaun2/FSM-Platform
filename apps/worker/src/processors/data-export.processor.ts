import { eq } from "drizzle-orm";
import type { Job, Processor } from "bullmq";
import pino from "pino";

import { uploadFile } from "@fsm/config/storage";
import { dataExportSessions, db, emitEventWithExecutor } from "@fsm/db";
import { countExportRecords, gatherTenantExportPayload } from "../lib/tenant-data-export.js";
import {
  DATA_EXPORT_MANIFEST_VERSION,
  EXPORT_QUEUE_JOB_NAMES,
  type TenantDataExportJobData
} from "@fsm/types";

const logger = pino({
  name: "data-export-processor"
});

async function updateProgress(exportSessionId: string, progressPercent: number): Promise<void> {
  await db
    .update(dataExportSessions)
    .set({
      progressPercent,
      updatedAt: new Date()
    })
    .where(eq(dataExportSessions.id, exportSessionId));
}

export async function runTenantDataExport(jobData: TenantDataExportJobData): Promise<void> {
  const { companyId, exportSessionId, requestedById } = jobData;

  const [session] = await db
    .select()
    .from(dataExportSessions)
    .where(eq(dataExportSessions.id, exportSessionId))
    .limit(1);

  if (!session || session.companyId !== companyId) {
    logger.warn({ exportSessionId, companyId }, "Export session missing or tenant mismatch");
    return;
  }

  if (session.status === "completed") {
    return;
  }

  await db
    .update(dataExportSessions)
    .set({
      status: "processing",
      progressPercent: 5,
      updatedAt: new Date()
    })
    .where(eq(dataExportSessions.id, exportSessionId));

  try {
    await updateProgress(exportSessionId, 25);
    const payload = await gatherTenantExportPayload(companyId);
    await updateProgress(exportSessionId, 70);

    const fileName = `tenant-export-${exportSessionId}.json`;
    const fileKey = `exports/${companyId}/${fileName}`;
    const buffer = Buffer.from(JSON.stringify(payload, null, 2), "utf8");
    const uploaded = await uploadFile(fileKey, buffer, "application/json");
    const recordCounts = countExportRecords(payload);

    await db
      .update(dataExportSessions)
      .set({
        status: "completed",
        progressPercent: 100,
        fileName,
        fileUrl: uploaded.url,
        recordCounts,
        completedAt: new Date(),
        errorMessage: null,
        updatedAt: new Date()
      })
      .where(eq(dataExportSessions.id, exportSessionId));

    await emitEventWithExecutor(db, {
      companyId,
      actorId: requestedById,
      actorType: "user",
      eventType: "export.completed",
      entityType: "data_export_session",
      entityId: exportSessionId,
      payload: {
        manifestVersion: DATA_EXPORT_MANIFEST_VERSION,
        recordCounts
      },
      summary: "Organization data export completed"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed";

    await db
      .update(dataExportSessions)
      .set({
        status: "failed",
        errorMessage: message,
        updatedAt: new Date()
      })
      .where(eq(dataExportSessions.id, exportSessionId));

    await emitEventWithExecutor(db, {
      companyId,
      actorId: requestedById,
      actorType: "user",
      eventType: "export.failed",
      entityType: "data_export_session",
      entityId: exportSessionId,
      payload: { message },
      summary: "Organization data export failed"
    });

    throw error;
  }
}

export function createDataExportProcessor(): Processor<Record<string, unknown>> {
  return async (job: Job<Record<string, unknown>>) => {
    switch (job.name) {
      case EXPORT_QUEUE_JOB_NAMES.tenantDataExport:
        await runTenantDataExport(job.data as unknown as TenantDataExportJobData);
        return;
      default:
        logger.warn({ jobId: job.id ?? null, jobName: job.name }, "Unknown data export job received");
    }
  };
}

export const processDataExport = createDataExportProcessor();
