import type { Job, Processor } from "bullmq";
import pino from "pino";
import { and, eq, isNull } from "drizzle-orm";

import { automationRules, db, invoices, markInvoiceOverdueIfNeeded } from "@fsm/db";
import { invoicesQueue, notificationsQueue } from "@fsm/jobs";

const logger = pino({
  name: "invoice-reminder-processor"
});

type ReminderLevel = 1 | 2 | 3;
type InvoiceStatus = typeof invoices.$inferSelect.status;

interface MarkOverdueResult {
  id: string;
  companyId: string;
  customerId: string;
  status: InvoiceStatus;
}

interface InvoiceReminderState {
  id: string;
  companyId: string;
  customerId: string;
  status: InvoiceStatus;
  reminder1SentAt: Date | null;
  reminder2SentAt: Date | null;
  reminder3SentAt: Date | null;
}

interface InvoiceReminderRule {
  companyId: string;
  delayHours: number | null;
}

export interface InvoiceReminderDependencies {
  markOverdue(companyId: string, invoiceId: string): Promise<MarkOverdueResult>;
  loadInvoice(companyId: string, invoiceId: string): Promise<InvoiceReminderState | null>;
  findInvoiceReminderRule(companyId: string): Promise<InvoiceReminderRule | null>;
  enqueueReminderJob(
    jobName: "send-invoice-reminder-1" | "send-invoice-reminder-2" | "send-invoice-reminder-3",
    data: {
      companyId: string;
      invoiceId: string;
      customerId: string;
      reminderLevel: ReminderLevel;
    },
    delay: number
  ): Promise<void>;
  enqueueNotificationReminder(
    data: {
      companyId: string;
      invoiceId: string;
      customerId: string;
      reminderLevel: ReminderLevel;
    }
  ): Promise<void>;
}

function getJobString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getReminderLevel(data: Record<string, unknown>): ReminderLevel | null {
  const value = data.reminderLevel;
  return value === 1 || value === 2 || value === 3 ? value : null;
}

function isInvoiceUnpaid(status: InvoiceStatus): boolean {
  return status === "sent" || status === "partially_paid" || status === "overdue";
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const productionDependenciesPromise: Promise<InvoiceReminderDependencies> = Promise.resolve({
    async markOverdue(companyId, invoiceId) {
      const invoice = await markInvoiceOverdueIfNeeded(companyId, invoiceId);

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      return invoice;
    },
    async loadInvoice(companyId, invoiceId) {
      const [invoice] = await db
        .select({
          id: invoices.id,
          companyId: invoices.companyId,
          customerId: invoices.customerId,
          status: invoices.status,
          reminder1SentAt: invoices.reminder1SentAt,
          reminder2SentAt: invoices.reminder2SentAt,
          reminder3SentAt: invoices.reminder3SentAt
        })
        .from(invoices)
        .where(and(eq(invoices.companyId, companyId), eq(invoices.id, invoiceId), isNull(invoices.deletedAt)))
        .limit(1);

      return invoice ?? null;
    },
    async findInvoiceReminderRule(companyId) {
      const [rule] = await db
        .select({
          companyId: automationRules.companyId,
          delayHours: automationRules.delayHours
        })
        .from(automationRules)
        .where(
          and(
            eq(automationRules.companyId, companyId),
            eq(automationRules.ruleType, "invoice_reminder"),
            eq(automationRules.isEnabled, true),
            isNull(automationRules.deletedAt)
          )
        )
        .limit(1);

      return rule ?? null;
    },
    async enqueueReminderJob(jobName, data, delay) {
      await invoicesQueue.add(jobName, data, {
        delay,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000
        },
        jobId: `${jobName}-${data.invoiceId}`
      });
    },
    async enqueueNotificationReminder(data) {
      await notificationsQueue.add("send-invoice-reminder", data, {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000
        },
        jobId: `send-invoice-reminder-${data.invoiceId}-${data.reminderLevel}`
      });
    }
  });

async function getProductionDependencies(): Promise<InvoiceReminderDependencies> {
  return productionDependenciesPromise;
}

export async function handleCheckInvoiceOverdue(
  job: Job<Record<string, unknown>>,
  dependencies: InvoiceReminderDependencies
): Promise<void> {
  const companyId = getJobString(job.data, "companyId");
  const invoiceId = getJobString(job.data, "invoiceId");

  if (!companyId || !invoiceId) {
    logger.warn({ jobId: job.id ?? null }, "Invoice overdue job missing required identifiers");
    return;
  }

  const result = await dependencies.markOverdue(companyId, invoiceId);

  if (result.status !== "overdue") {
    logger.info({ companyId, invoiceId }, "Invoice overdue job skipped because invoice is not overdue");
    return;
  }

  const rule = await dependencies.findInvoiceReminderRule(companyId);

  if (!rule) {
    logger.info({ companyId, invoiceId }, "Invoice reminder escalation skipped because automation is disabled");
    return;
  }

  const level1Delay = (rule.delayHours ?? 72) * 60 * 60 * 1000;
  const level2Delay = level1Delay + 4 * DAY_IN_MS;
  const level3Delay = level2Delay + 7 * DAY_IN_MS;

  await dependencies.enqueueReminderJob(
    "send-invoice-reminder-1",
    {
      companyId,
      invoiceId,
      customerId: result.customerId,
      reminderLevel: 1
    },
    level1Delay
  );
  await dependencies.enqueueReminderJob(
    "send-invoice-reminder-2",
    {
      companyId,
      invoiceId,
      customerId: result.customerId,
      reminderLevel: 2
    },
    level2Delay
  );
  await dependencies.enqueueReminderJob(
    "send-invoice-reminder-3",
    {
      companyId,
      invoiceId,
      customerId: result.customerId,
      reminderLevel: 3
    },
    level3Delay
  );

  logger.info({ companyId, invoiceId, customerId: result.customerId }, "Invoice reminder escalation scheduled");
}

export async function handleReminderOrchestration(
  job: Job<Record<string, unknown>>,
  dependencies: InvoiceReminderDependencies,
  reminderLevel: ReminderLevel
): Promise<void> {
  const companyId = getJobString(job.data, "companyId");
  const invoiceId = getJobString(job.data, "invoiceId");
  const customerId = getJobString(job.data, "customerId");

  if (!companyId || !invoiceId || !customerId) {
    logger.warn({ jobId: job.id ?? null, reminderLevel }, "Invoice reminder orchestration missing required identifiers");
    return;
  }

  const rule = await dependencies.findInvoiceReminderRule(companyId);

  if (!rule) {
    logger.info({ companyId, invoiceId, customerId, reminderLevel }, "Invoice reminder orchestration skipped because automation is disabled");
    return;
  }

  const invoice = await dependencies.loadInvoice(companyId, invoiceId);

  if (!invoice || invoice.customerId !== customerId) {
    logger.warn({ companyId, invoiceId, customerId, reminderLevel }, "Invoice reminder orchestration skipped because invoice context was not found");
    return;
  }

  if (!isInvoiceUnpaid(invoice.status)) {
    logger.info({ companyId, invoiceId, customerId, reminderLevel }, "Invoice reminder orchestration skipped because invoice is no longer unpaid");
    return;
  }

  const reminderTimestamp =
    reminderLevel === 1
      ? invoice.reminder1SentAt
      : reminderLevel === 2
        ? invoice.reminder2SentAt
        : invoice.reminder3SentAt;

  if (reminderTimestamp) {
    logger.info(
      { companyId, invoiceId, customerId, reminderLevel },
      "Invoice reminder orchestration skipped because reminder already sent"
    );
    return;
  }

  await dependencies.enqueueNotificationReminder({
    companyId,
    invoiceId,
    customerId,
    reminderLevel
  });

  logger.info({ companyId, invoiceId, customerId, reminderLevel }, "Invoice reminder notification queued");
}

export function createInvoiceReminderProcessor(
  dependenciesProvider: InvoiceReminderDependencies | (() => Promise<InvoiceReminderDependencies>)
): Processor<Record<string, unknown>, void, string> {
  return async (job) => {
    const dependencies =
      typeof dependenciesProvider === "function"
        ? await dependenciesProvider()
        : dependenciesProvider;

    switch (job.name) {
      case "check-invoice-overdue":
        await handleCheckInvoiceOverdue(job, dependencies);
        return;
      case "send-invoice-reminder-1":
        await handleReminderOrchestration(job, dependencies, 1);
        return;
      case "send-invoice-reminder-2":
        await handleReminderOrchestration(job, dependencies, 2);
        return;
      case "send-invoice-reminder-3":
        await handleReminderOrchestration(job, dependencies, 3);
        return;
      default:
        logger.warn({ jobId: job.id ?? null, jobName: job.name }, "Unknown invoice reminder job received");
    }
  };
}

export const processInvoiceReminder = createInvoiceReminderProcessor(getProductionDependencies);
