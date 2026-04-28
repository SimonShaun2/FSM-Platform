import type { Job } from "bullmq";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { setupTestEnv } from "../../../api/src/test-support/env-setup.js";

setupTestEnv();

vi.mock("@fsm/jobs", () => ({
  invoicesQueue: {
    add: vi.fn()
  },
  notificationsQueue: {
    add: vi.fn()
  }
}));

type InvoiceReminderProcessorModule = typeof import("./invoice-reminder.processor.js");

let invoiceReminderProcessor: InvoiceReminderProcessorModule;

beforeAll(async () => {
  invoiceReminderProcessor = await import("./invoice-reminder.processor.js");
});

function createJob(name: string, data: Record<string, unknown>): Job<Record<string, unknown>> {
  return {
    id: `job-${name}`,
    name,
    data
  } as unknown as Job<Record<string, unknown>>;
}

function createDependencies(): invoiceReminderProcessor.InvoiceReminderDependencies {
  return {
    markOverdue: vi.fn(async () => ({
      id: "invoice-1",
      companyId: "company-1",
      customerId: "customer-1",
      status: "overdue"
    })),
    loadInvoice: vi.fn(async () => null),
    findInvoiceReminderRule: vi.fn(async () => null),
    enqueueReminderJob: vi.fn(async () => undefined),
    enqueueNotificationReminder: vi.fn(async () => undefined)
  };
}

describe("invoice-reminder.processor", () => {
  let dependencies: invoiceReminderProcessor.InvoiceReminderDependencies;

  beforeEach(() => {
    dependencies = createDependencies();
  });

  it("check-invoice-overdue schedules all three escalating reminder jobs with the correct delays", async () => {
    vi.mocked(dependencies.findInvoiceReminderRule).mockResolvedValue({
      companyId: "company-1",
      delayHours: 24
    });

    await invoiceReminderProcessor.handleCheckInvoiceOverdue(
      createJob("check-invoice-overdue", {
        companyId: "company-1",
        invoiceId: "invoice-1"
      }),
      dependencies
    );

    expect(dependencies.enqueueReminderJob).toHaveBeenNthCalledWith(
      1,
      "send-invoice-reminder-1",
      {
        companyId: "company-1",
        invoiceId: "invoice-1",
        customerId: "customer-1",
        reminderLevel: 1
      },
      24 * 60 * 60 * 1000
    );
    expect(dependencies.enqueueReminderJob).toHaveBeenNthCalledWith(
      2,
      "send-invoice-reminder-2",
      {
        companyId: "company-1",
        invoiceId: "invoice-1",
        customerId: "customer-1",
        reminderLevel: 2
      },
      24 * 60 * 60 * 1000 + 4 * 24 * 60 * 60 * 1000
    );
    expect(dependencies.enqueueReminderJob).toHaveBeenNthCalledWith(
      3,
      "send-invoice-reminder-3",
      {
        companyId: "company-1",
        invoiceId: "invoice-1",
        customerId: "customer-1",
        reminderLevel: 3
      },
      24 * 60 * 60 * 1000 + 4 * 24 * 60 * 60 * 1000 + 7 * 24 * 60 * 60 * 1000
    );
  });

  it("send-invoice-reminder-1 enqueues the notification job when the invoice is still unpaid", async () => {
    vi.mocked(dependencies.findInvoiceReminderRule).mockResolvedValue({
      companyId: "company-1",
      delayHours: 72
    });
    vi.mocked(dependencies.loadInvoice).mockResolvedValue({
      id: "invoice-1",
      companyId: "company-1",
      customerId: "customer-1",
      status: "overdue",
      reminder1SentAt: null,
      reminder2SentAt: null,
      reminder3SentAt: null
    });

    await invoiceReminderProcessor.handleReminderOrchestration(
      createJob("send-invoice-reminder-1", {
        companyId: "company-1",
        invoiceId: "invoice-1",
        customerId: "customer-1",
        reminderLevel: 1
      }),
      dependencies,
      1
    );

    expect(dependencies.enqueueNotificationReminder).toHaveBeenCalledWith({
      companyId: "company-1",
      invoiceId: "invoice-1",
      customerId: "customer-1",
      reminderLevel: 1
    });
  });

  it("send-invoice-reminder-1 discards cleanly when the invoice is already paid", async () => {
    vi.mocked(dependencies.findInvoiceReminderRule).mockResolvedValue({
      companyId: "company-1",
      delayHours: 72
    });
    vi.mocked(dependencies.loadInvoice).mockResolvedValue({
      id: "invoice-1",
      companyId: "company-1",
      customerId: "customer-1",
      status: "paid",
      reminder1SentAt: null,
      reminder2SentAt: null,
      reminder3SentAt: null
    });

    await invoiceReminderProcessor.handleReminderOrchestration(
      createJob("send-invoice-reminder-1", {
        companyId: "company-1",
        invoiceId: "invoice-1",
        customerId: "customer-1",
        reminderLevel: 1
      }),
      dependencies,
      1
    );

    expect(dependencies.enqueueNotificationReminder).not.toHaveBeenCalled();
  });
});
