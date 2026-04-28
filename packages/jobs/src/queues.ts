import { Queue } from "bullmq";

import { redisConnection } from "./connection.js";

export const QUEUE_NAMES = {
  imports: "fsm:imports",
  ai: "fsm:ai",
  notifications: "fsm:notifications",
  invoices: "fsm:invoices",
  agreements: "fsm:agreements",
  webhooks: "fsm:webhooks"
} as const;

export const importsQueue = new Queue(QUEUE_NAMES.imports, {
  connection: redisConnection
});

export const aiQueue = new Queue(QUEUE_NAMES.ai, {
  connection: redisConnection
});

export const notificationsQueue = new Queue(QUEUE_NAMES.notifications, {
  connection: redisConnection
});

export const invoicesQueue = new Queue(QUEUE_NAMES.invoices, {
  connection: redisConnection
});

export const agreementsQueue = new Queue(QUEUE_NAMES.agreements, {
  connection: redisConnection
});

export const webhooksQueue = new Queue(QUEUE_NAMES.webhooks, {
  connection: redisConnection
});
