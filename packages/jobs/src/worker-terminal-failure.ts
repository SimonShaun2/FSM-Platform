import type { Job } from "bullmq";

import { forwardJobToDeadLetter, isJobExhausted } from "./dead-letter-queue.js";

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
