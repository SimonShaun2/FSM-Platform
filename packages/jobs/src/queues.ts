import { Queue } from "bullmq";

import { redisConnection } from "./connection.js";
import { platformDefaultJobOptions } from "./queue-retry-policy.js";
import { DEAD_LETTER_QUEUE_SUFFIX, QUEUE_NAMES, QUEUE_PREFIX } from "./queue-names.js";

export { DEAD_LETTER_QUEUE_SUFFIX, QUEUE_NAMES, QUEUE_PREFIX } from "./queue-names.js";

export const queueBaseOptions = {
  connection: redisConnection,
  prefix: QUEUE_PREFIX
} as const;

function createPlatformQueue(name: string): Queue {
  return new Queue(name, {
    ...queueBaseOptions,
    defaultJobOptions: platformDefaultJobOptions()
  });
}

export const importsQueue = createPlatformQueue(QUEUE_NAMES.imports);

export const aiQueue = createPlatformQueue(QUEUE_NAMES.ai);

export const notificationsQueue = createPlatformQueue(QUEUE_NAMES.notifications);

export const invoicesQueue = createPlatformQueue(QUEUE_NAMES.invoices);

export const agreementsQueue = createPlatformQueue(QUEUE_NAMES.agreements);

export const webhooksQueue = createPlatformQueue(QUEUE_NAMES.webhooks);

export const operatorQueue = createPlatformQueue(QUEUE_NAMES.operator);
