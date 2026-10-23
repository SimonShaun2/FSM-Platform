import { describe, expect, it, vi } from "vitest";
import type { Job } from "bullmq";

import {
  IMPORT_QUEUE_JOB_NAMES,
  buildMigrateFileBatchIdempotencyKey,
  type MigrateFileBatchJobData
} from "@fsm/types";

import { handleMigrateFileBatch } from "./migrate-file-batch.processor.js";

function createJob(data: MigrateFileBatchJobData): Job<MigrateFileBatchJobData> {
  return {
    id: "job-1",
    name: IMPORT_QUEUE_JOB_NAMES.migrateFileBatch,
    data,
    updateProgress: vi.fn().mockResolvedValue(undefined)
  } as Job<MigrateFileBatchJobData>;
}

describe("migrate-file-batch processor stub", () => {
  const companyId = "11111111-1111-4111-8111-111111111111";
  const importSessionId = "22222222-2222-4222-8222-222222222222";
  const importBundleId = "33333333-3333-4333-8333-333333333333";

  it("validates tenant-scoped keys and records stub progress", async () => {
    const job = createJob({
      companyId,
      importSessionId,
      importBundleId,
      sourceSystem: "jobber",
      batchIndex: 0,
      batchesTotal: 1,
      idempotencyKey: buildMigrateFileBatchIdempotencyKey(importSessionId, 0),
      objects: [{ vendorFileId: "v-1", relativePath: "media/v-1.png" }]
    });

    await handleMigrateFileBatch(job);

    expect(job.updateProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "stub_complete",
        objectsAcknowledged: 1
      })
    );
  });

  it("rejects object keys outside tenant bundle scope", async () => {
    const job = createJob({
      companyId,
      importSessionId,
      importBundleId,
      sourceSystem: "jobber",
      batchIndex: 0,
      batchesTotal: 1,
      idempotencyKey: buildMigrateFileBatchIdempotencyKey(importSessionId, 0),
      objects: [
        {
          vendorFileId: "v-2",
          relativePath: "media/v-2.png",
          r2Key: "other-tenant/imports/other/file.png"
        }
      ]
    });

    await expect(handleMigrateFileBatch(job)).rejects.toThrow(/tenant scope/);
  });
});
