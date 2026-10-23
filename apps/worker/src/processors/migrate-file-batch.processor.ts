import type { Job, Processor } from "bullmq";
import pino from "pino";

import {
  assertImportBundleObjectKeyBelongsToTenant,
  buildImportBundleObjectKey
} from "@fsm/config/import-bundle-storage";
import { logMigrateFileBatchTrace } from "@fsm/jobs";
import {
  IMPORT_QUEUE_JOB_NAMES,
  MigrateFileBatchJobDataSchema,
  buildMigrateFileBatchJobId,
  buildMigrateFileBatchTraceObjects,
  type MigrateFileBatchJobData
} from "@fsm/types";

const logger = pino({
  name: "migrate-file-batch-processor"
});

export async function handleMigrateFileBatch(job: Job<MigrateFileBatchJobData>): Promise<void> {
  const payload = MigrateFileBatchJobDataSchema.parse(job.data);
  const bullJobId = job.id ?? buildMigrateFileBatchJobId(payload.importSessionId, payload.batchIndex);
  const resolveR2Key = (relativePath: string) =>
    buildImportBundleObjectKey(payload.companyId, payload.importBundleId, relativePath);
  const traceObjects = buildMigrateFileBatchTraceObjects(payload.objects, resolveR2Key);

  for (const object of traceObjects) {
    assertImportBundleObjectKeyBelongsToTenant(object.r2Key, payload.companyId, payload.importBundleId);
  }

  logMigrateFileBatchTrace(
    {
      phase: "worker_start",
      companyId: payload.companyId,
      importSessionId: payload.importSessionId,
      importBundleId: payload.importBundleId,
      bullJobId,
      batchIndex: payload.batchIndex,
      batchesTotal: payload.batchesTotal,
      idempotencyKey: payload.idempotencyKey,
      objects: traceObjects
    },
    "FS-MIGRATE migrate-file-batch worker started"
  );

  await job.updateProgress({
    batchIndex: payload.batchIndex,
    batchesTotal: payload.batchesTotal,
    objectsAcknowledged: payload.objects.length,
    status: "stub_complete"
  });

  logMigrateFileBatchTrace(
    {
      phase: "worker_complete",
      companyId: payload.companyId,
      importSessionId: payload.importSessionId,
      importBundleId: payload.importBundleId,
      bullJobId,
      batchIndex: payload.batchIndex,
      batchesTotal: payload.batchesTotal,
      idempotencyKey: payload.idempotencyKey,
      objects: traceObjects
    },
    "FS-MIGRATE migrate-file-batch worker completed (checkpoint reserved for Diego ingest)"
  );
}

export function createMigrateFileBatchProcessor(): Processor<MigrateFileBatchJobData, void, string> {
  return async (job) => {
    if (job.name !== IMPORT_QUEUE_JOB_NAMES.migrateFileBatch) {
      logger.warn({ jobId: job.id ?? null, jobName: job.name }, "Unexpected job routed to migrate-file-batch handler");
      return;
    }

    await handleMigrateFileBatch(job);
  };
}
