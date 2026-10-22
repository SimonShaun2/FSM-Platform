import type { Job, Queue } from "bullmq";
import { Queue as BullQueue } from "bullmq";

import {
  DeadLetterJobEnvelopeV1Schema,
  type DeadLetterRecoveryRequestV1
} from "@fsm/types";

import {
  buildDeadLetterEnvelope,
  buildDeadLetterQueueName,
  isJobExhausted
} from "./dead-letter-job.js";
import { QUEUE_PREFIX } from "./queue-names.js";
import { queueBaseOptions } from "./queues.js";
import { platformDefaultJobOptions } from "./queue-retry-policy.js";

export { buildDeadLetterEnvelope, buildDeadLetterQueueName, isJobExhausted } from "./dead-letter-job.js";

const deadLetterQueues = new Map<string, Queue>();

export function getDeadLetterQueue(sourceQueueName: string): Queue {
  const name = buildDeadLetterQueueName(sourceQueueName);
  const existing = deadLetterQueues.get(name);

  if (existing) {
    return existing;
  }

  const queue = new BullQueue(name, {
    ...queueBaseOptions,
    defaultJobOptions: platformDefaultJobOptions({ attempts: 1 })
  });

  deadLetterQueues.set(name, queue);
  return queue;
}

export async function forwardJobToDeadLetter(
  sourceQueueName: string,
  job: Job<Record<string, unknown>>,
  error: Error
): Promise<void> {
  const envelope = buildDeadLetterEnvelope(sourceQueueName, job, error);
  const dlq = getDeadLetterQueue(sourceQueueName);

  await dlq.add(
    envelope.jobName,
    envelope,
    {
      jobId: `${QUEUE_PREFIX}:dlq:${sourceQueueName}:${job.id}`
    }
  );
}

export async function recoverDeadLetterJob(
  sourceQueue: Queue,
  request: DeadLetterRecoveryRequestV1
): Promise<string> {
  const dlq = getDeadLetterQueue(request.sourceQueue);
  const deadLetterJob = await dlq.getJob(request.deadLetterJobId);

  if (!deadLetterJob) {
    throw new Error("Dead-letter job not found");
  }

  const envelope = DeadLetterJobEnvelopeV1Schema.parse(deadLetterJob.data);
  const recovered = await sourceQueue.add(envelope.jobName, envelope.payload, {
    ...platformDefaultJobOptions(),
    jobId: `${QUEUE_PREFIX}:recover:${request.sourceQueue}:${envelope.sourceJobId}`
  });

  if (!recovered.id) {
    throw new Error("Failed to re-queue recovered job");
  }

  await deadLetterJob.remove();
  return String(recovered.id);
}
