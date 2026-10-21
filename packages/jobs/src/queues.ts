import { Queue } from "bullmq";

import { redisConnection } from "./connection.js";

export const QUEUE_PREFIX = "fsm";

export const QUEUE_NAMES = {
  imports: "imports",
  ai: "ai",
  notifications: "notifications",
  invoices: "invoices",
  agreements: "agreements",
  webhooks: "webhooks",
  operator: "operator"
} as const;

export const queueBaseOptions = {
  connection: redisConnection,
  prefix: QUEUE_PREFIX
} as const;

export const importsQueue = new Queue(QUEUE_NAMES.imports, queueBaseOptions);

export const aiQueue = new Queue(QUEUE_NAMES.ai, queueBaseOptions);

export const notificationsQueue = new Queue(QUEUE_NAMES.notifications, queueBaseOptions);

export const invoicesQueue = new Queue(QUEUE_NAMES.invoices, queueBaseOptions);

export const agreementsQueue = new Queue(QUEUE_NAMES.agreements, queueBaseOptions);

export const webhooksQueue = new Queue(QUEUE_NAMES.webhooks, queueBaseOptions);

export const operatorQueue = new Queue(QUEUE_NAMES.operator, queueBaseOptions);
