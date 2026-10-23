import type { Job, Processor } from "bullmq";
import pino from "pino";

import {
  assertImportBundleObjectKeyBelongsToTenant,
  buildImportBundleObjectKey
} from "@fsm/config/import-bundle-storage";
import {
  IMPORT_QUEUE_JOB_NAMES,
  MigrateFileBatchJobDataSchema,
  type MigrateFileBatchJobData
} from "@fsm/types";

const logger = pino({
  name: "migrate-file-batch-processor"
});

export async function handleMigrateFileBatch(job: Job<MigrateFileBatchJobData>): Promise<void> {
  const payload = MigrateFileBatchJobDataSchema.parse(job.data);

  for (const object of payload.objects) {
    const objectKey =
      object.r2Key ??
      buildImportBundleObjectKey(payload.companyId, payload.importBundleId, object.relativePath);
    assertImportBundleObjectKeyBelongsToTenant(objectKey, payload.companyId, payload.importBundleId);
  }

  logger.info(
    {
      companyId: payload.companyId,
      importSessionId: payload.importSessionId,
      importBundleId: payload.importBundleId,
      batchIndex: payload.batchIndex,
      batchesTotal: payload.batchesTotal,
      objectCount: payload.objects.length,
      idempotencyKey: payload.idempotencyKey
    },
    "migrate-file-batch stub processed (checkpoint reserved for Diego ingest)"
  );

  await job.updateProgress({
    batchIndex: payload.batchIndex,
    batchesTotal: payload.batchesTotal,
    objectsAcknowledged: payload.objects.length,
    status: "stub_complete"
  });
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
