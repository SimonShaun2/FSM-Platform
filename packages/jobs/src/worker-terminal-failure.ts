import type { Job } from "bullmq";

import { isJobExhausted } from "./dead-letter-job.js";
import { forwardJobToDeadLetter } from "./dead-letter-queue.js";

export async function handleWorkerJobFailed(
  sourceQueueName: string,
  job: Job<Record<string, unknown>> | undefined,
  error: Error
): Promise<void> {
  if (!job) {
    return;
  }

  if (!isJobExhausted(job)) {
    return;
  }

  await forwardJobToDeadLetter(sourceQueueName, job, error);
}
