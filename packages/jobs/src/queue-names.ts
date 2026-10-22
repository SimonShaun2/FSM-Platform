export const QUEUE_PREFIX = "fsm";

export const DEAD_LETTER_QUEUE_SUFFIX = "dlq";

export const QUEUE_NAMES = {
  imports: "imports",
  ai: "ai",
  notifications: "notifications",
  invoices: "invoices",
  agreements: "agreements",
  webhooks: "webhooks",
  operator: "operator",
  exports: "exports",
  growth: "growth"
} as const;

export type PlatformQueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
