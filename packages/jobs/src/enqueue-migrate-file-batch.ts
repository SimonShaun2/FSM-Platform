import {
  MigrateFileBatchJobDataSchema,
  buildMigrateFileBatchJobId,
  IMPORT_QUEUE_JOB_NAMES,
  type MigrateFileBatchJobData
} from "@fsm/types";

import { buildDefaultEnqueueJobOptions } from "./queue-policy.js";
import { importsQueue } from "./queues.js";

export async function enqueueMigrateFileBatchJob(data: MigrateFileBatchJobData): Promise<void> {
  const payload = MigrateFileBatchJobDataSchema.parse(data);

  await importsQueue.add(
    IMPORT_QUEUE_JOB_NAMES.migrateFileBatch,
    payload,
    buildDefaultEnqueueJobOptions({
      jobId: buildMigrateFileBatchJobId(payload.importSessionId, payload.batchIndex)
    })
  );
}
