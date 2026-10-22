import type { Job, Queue } from "bullmq";
import { Queue as BullQueue } from "bullmq";

import {
  classifyJobFailureV1,
  DeadLetterJobEnvelopeV1Schema,
  type DeadLetterJobEnvelopeV1,
  type DeadLetterRecoveryRequestV1,
  QUEUE_PLATFORM_CONTRACT_VERSION
} from "@fsm/types";

import { DEAD_LETTER_QUEUE_SUFFIX, QUEUE_PREFIX } from "./queue-names.js";
import { queueBaseOptions } from "./queues.js";
import { platformDefaultJobOptions } from "./queue-retry-policy.js";

const deadLetterQueues = new Map<string, Queue>();

export function buildDeadLetterQueueName(sourceQueueName: string): string {
  return `${sourceQueueName}-${DEAD_LETTER_QUEUE_SUFFIX}`;
}

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

function extractCompanyId(payload: Record<string, unknown>): string | undefined {
  const companyId = payload.companyId;
  return typeof companyId === "string" ? companyId : undefined;
}

export function buildDeadLetterEnvelope(
  sourceQueueName: string,
  job: Job<Record<string, unknown>>,
  error: Error
): DeadLetterJobEnvelopeV1 {
  const payload = (job.data ?? {}) as Record<string, unknown>;

  return DeadLetterJobEnvelopeV1Schema.parse({
    contractVersion: QUEUE_PLATFORM_CONTRACT_VERSION,
    sourceQueue: sourceQueueName,
    sourceJobId: String(job.id),
    jobName: job.name,
    ...(extractCompanyId(payload) ? { companyId: extractCompanyId(payload) } : {}),
    payload,
    attemptsMade: job.attemptsMade,
    failedAt: new Date().toISOString(),
    failureClass: classifyJobFailureV1(error),
    errorMessage: error.message.slice(0, 4_000)
  });
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

export function isJobExhausted(job: Job<Record<string, unknown>>): boolean {
  const maxAttempts = job.opts.attempts ?? 1;
  return job.attemptsMade >= maxAttempts;
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
