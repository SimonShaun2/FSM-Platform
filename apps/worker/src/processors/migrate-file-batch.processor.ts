import type { Job, Processor } from "bullmq";
import pino from "pino";

import {
  IMPORT_QUEUE_JOB_NAMES,
  MigrateFileBatchJobDataSchema,
  parseMigrateFileBatchJobProgress,
  type MigrateFileBatchFailedObject,
  buildMigrateFileBatchJobProgress,
  type MigrateFileBatchJobData
} from "@fsm/types";

import { processMigrateFileBatchObject } from "./migrate-file-batch-object.js";

const logger = pino({
  name: "migrate-file-batch-processor"
});

export class MigrateFileBatchPartialFailureError extends Error {
  readonly failures: MigrateFileBatchFailedObject[];

  constructor(failures: MigrateFileBatchFailedObject[]) {
    super(`migrate-file-batch: ${failures.length} object(s) failed`);
    this.name = "MigrateFileBatchPartialFailureError";
    this.failures = failures;
  }
}

export async function handleMigrateFileBatch(job: Job<MigrateFileBatchJobData>): Promise<void> {
  const payload = MigrateFileBatchJobDataSchema.parse(job.data);
  const previousProgress = parseMigrateFileBatchJobProgress(job.progress);
  const succeeded = new Set(previousProgress?.objectsSucceeded ?? []);
  const failuresByVendorId = new Map<string, MigrateFileBatchFailedObject>();

  for (const failure of previousProgress?.objectsFailed ?? []) {
    if (!succeeded.has(failure.vendorFileId)) {
      failuresByVendorId.set(failure.vendorFileId, failure);
    }
  }

  for (const object of payload.objects) {
    if (succeeded.has(object.vendorFileId)) {
      continue;
    }

    try {
      await processMigrateFileBatchObject(object, payload);
      succeeded.add(object.vendorFileId);
      failuresByVendorId.delete(object.vendorFileId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "migrate-file-batch object failed";
      failuresByVendorId.set(object.vendorFileId, {
        vendorFileId: object.vendorFileId,
        errorMessage
      });
    }

    const objectsFailed = [...failuresByVendorId.values()];
    const status = objectsFailed.length > 0 ? "partial_failure" : "in_progress";

    await job.updateProgress(
      buildMigrateFileBatchJobProgress(payload, [...succeeded], objectsFailed, status)
    );
  }

  const objectsFailed = [...failuresByVendorId.values()];

  if (objectsFailed.length > 0) {
    await job.updateProgress(
      buildMigrateFileBatchJobProgress(payload, [...succeeded], objectsFailed, "partial_failure")
    );
    throw new MigrateFileBatchPartialFailureError(objectsFailed);
  }

  await job.updateProgress(
    buildMigrateFileBatchJobProgress(payload, [...succeeded], [], "stub_complete")
  );

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
