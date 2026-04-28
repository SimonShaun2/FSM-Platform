import type { Worker } from "bullmq";
import pino from "pino";

import { QUEUE_NAMES } from "@fsm/jobs";

import { createWorker } from "./lib/worker-factory.js";
import { processAgreements } from "./processors/agreements.processor.js";
import { processAiRevenue } from "./processors/ai-revenue.processor.js";
import { processCsvImport } from "./processors/csv-import.processor.js";
import { processInvoiceReminder } from "./processors/invoice-reminder.processor.js";
import { processNotifications } from "./processors/notifications.processor.js";

const logger = pino({
  name: "fsm-worker-bootstrap"
});

const workers: Array<Worker<Record<string, unknown>, void, string>> = [
  createWorker(QUEUE_NAMES.imports, processCsvImport),
  createWorker(QUEUE_NAMES.ai, processAiRevenue),
  createWorker(QUEUE_NAMES.notifications, processNotifications),
  createWorker(QUEUE_NAMES.invoices, processInvoiceReminder),
  createWorker(QUEUE_NAMES.agreements, processAgreements),
  createWorker(QUEUE_NAMES.webhooks, async () => {})
];

logger.info(
  {
    queues: workers.length
  },
  "Workers started"
);

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  logger.info({ signal }, "Worker shutdown requested");
  await Promise.all(workers.map(async (worker) => worker.close()));
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
