import type { Job } from "bullmq";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@fsm/config", () => ({
  env: {
    APP_URL: "http://localhost:3000"
  }
}));

type NotificationsProcessorModule = typeof import("./notifications.processor.js");

let notificationsProcessor: NotificationsProcessorModule;

beforeAll(async () => {
  notificationsProcessor = await import("./notifications.processor.js");
});

function createJob(name: string, data: Record<string, unknown>): Job<Record<string, unknown>> {
  return {
    id: `job-${name}`,
    name,
    data
  } as unknown as Job<Record<string, unknown>>;
}

function createDependencies(): notificationsProcessor.NotificationsDependencies {
  return {
    email: {
      sendEstimateEmail: vi.fn(async () => undefined),
      sendInvoiceEmail: vi.fn(async () => undefined),
      sendInvoiceReminderEmail: vi.fn(async () => undefined),
      sendInvoiceReminderOwnerAlertEmail: vi.fn(async () => undefined),
      sendServiceAgreementRenewalReminderEmail: vi.fn(async () => undefined),
      sendServiceAgreementPaymentFailedEmail: vi.fn(async () => undefined)
    },
    loadEstimateEmailContext: vi.fn(async () => null),
    loadInvoiceEmailContext: vi.fn(async () => null),
    loadServiceAgreementEmailContext: vi.fn(async () => null),
    loadCompanyOwner: vi.fn(async () => null),
    findAutomationRule: vi.fn(async () => null),
    markInvoiceReminderSent: vi.fn(async () => undefined)
  };
}

describe("notifications.processor", () => {
  let dependencies: notificationsProcessor.NotificationsDependencies;

  beforeEach(() => {
    dependencies = createDependencies();
  });

  it("send-estimate-email sends the estimate email when the customer can receive it", async () => {
    vi.mocked(dependencies.loadEstimateEmailContext).mockResolvedValue({
      companyId: "company-1",
      estimateId: "estimate-1",
      customerId: "customer-1",
      status: "sent",
      estimateNumber: "EST-1001",
      title: "Spring Tune-Up",
      total: "325.00",
      approvalToken: "approval-token",
      expiresAt: new Date("2026-05-28T00:00:00.000Z"),
      customer: {
        firstName: "Chris",
        email: "customer@example.com"
      },
      company: {
        name: "Acme HVAC"
      },
      items: [{ id: "item-1" }]
    });

    await notificationsProcessor.handleSendEstimateEmail(
      createJob("send-estimate-email", {
        companyId: "company-1",
        estimateId: "estimate-1",
        customerId: "customer-1"
      }),
      dependencies
    );

    expect(dependencies.email.sendEstimateEmail).toHaveBeenCalledWith("customer@example.com", {
      firstName: "Chris",
      estimateNumber: "EST-1001",
      title: "Spring Tune-Up",
      total: "325.00",
      expiresAt: "2026-05-28T00:00:00.000Z",
      approvalUrl: "http://localhost:3000/estimates/approval-token",
      companyName: "Acme HVAC"
    });
  });

  it("send-estimate-email skips cleanly when the customer has no email", async () => {
    vi.mocked(dependencies.loadEstimateEmailContext).mockResolvedValue({
      companyId: "company-1",
      estimateId: "estimate-1",
      customerId: "customer-1",
      status: "sent",
      estimateNumber: "EST-1001",
      title: "Spring Tune-Up",
      total: "325.00",
      approvalToken: "approval-token",
      expiresAt: new Date("2026-05-28T00:00:00.000Z"),
      customer: {
        firstName: "Chris",
        email: null
      },
      company: {
        name: "Acme HVAC"
      },
      items: []
    });

    await notificationsProcessor.handleSendEstimateEmail(
      createJob("send-estimate-email", {
        companyId: "company-1",
        estimateId: "estimate-1",
        customerId: "customer-1"
      }),
      dependencies
    );

    expect(dependencies.email.sendEstimateEmail).not.toHaveBeenCalled();
  });

  it("send-invoice-email sends the invoice email when the customer can receive it", async () => {
    vi.mocked(dependencies.loadInvoiceEmailContext).mockResolvedValue({
      companyId: "company-1",
      invoiceId: "invoice-1",
      customerId: "customer-1",
      status: "sent",
      invoiceNumber: "INV-1001",
      total: "400.00",
      balanceDue: "275.00",
      dueAt: new Date("2026-04-01T00:00:00.000Z"),
      stripePaymentLinkUrl: "https://example.com/pay",
      reminder1SentAt: null,
      reminder2SentAt: null,
      reminder3SentAt: null,
      customer: {
        firstName: "Chris",
        lastName: "Pine",
        email: "customer@example.com"
      },
      company: {
        name: "Acme HVAC"
      }
    });

    await notificationsProcessor.handleSendInvoiceEmail(
      createJob("send-invoice-email", {
        companyId: "company-1",
        invoiceId: "invoice-1",
        customerId: "customer-1"
      }),
      dependencies
    );

    expect(dependencies.email.sendInvoiceEmail).toHaveBeenCalledWith("customer@example.com", {
      firstName: "Chris",
      invoiceNumber: "INV-1001",
      total: "400.00",
      dueAt: "2026-04-01T00:00:00.000Z",
      paymentLinkUrl: "https://example.com/pay",
      companyName: "Acme HVAC"
    });
  });

  it("send-invoice-email skips cleanly when the customer has no email", async () => {
    vi.mocked(dependencies.loadInvoiceEmailContext).mockResolvedValue({
      companyId: "company-1",
      invoiceId: "invoice-1",
      customerId: "customer-1",
      status: "sent",
      invoiceNumber: "INV-1001",
      total: "400.00",
      balanceDue: "275.00",
      dueAt: new Date("2026-04-01T00:00:00.000Z"),
      stripePaymentLinkUrl: "https://example.com/pay",
      reminder1SentAt: null,
      reminder2SentAt: null,
      reminder3SentAt: null,
      customer: {
        firstName: "Chris",
        lastName: "Pine",
        email: null
      },
      company: {
        name: "Acme HVAC"
      }
    });

    await notificationsProcessor.handleSendInvoiceEmail(
      createJob("send-invoice-email", {
        companyId: "company-1",
        invoiceId: "invoice-1",
        customerId: "customer-1"
      }),
      dependencies
    );

    expect(dependencies.email.sendInvoiceEmail).not.toHaveBeenCalled();
  });

  it("send-invoice-email skips cleanly when the payment link is missing", async () => {
    vi.mocked(dependencies.loadInvoiceEmailContext).mockResolvedValue({
      companyId: "company-1",
      invoiceId: "invoice-1",
      customerId: "customer-1",
      status: "sent",
      invoiceNumber: "INV-1001",
      total: "400.00",
      balanceDue: "275.00",
      dueAt: new Date("2026-04-01T00:00:00.000Z"),
      stripePaymentLinkUrl: null,
      reminder1SentAt: null,
      reminder2SentAt: null,
      reminder3SentAt: null,
      customer: {
        firstName: "Chris",
        lastName: "Pine",
        email: "customer@example.com"
      },
      company: {
        name: "Acme HVAC"
      }
    });

    await notificationsProcessor.handleSendInvoiceEmail(
      createJob("send-invoice-email", {
        companyId: "company-1",
        invoiceId: "invoice-1",
        customerId: "customer-1"
      }),
      dependencies
    );

    expect(dependencies.email.sendInvoiceEmail).not.toHaveBeenCalled();
  });

  it("send-invoice-reminder sends the requested reminder level and updates the reminder timestamp", async () => {
    vi.mocked(dependencies.findAutomationRule).mockResolvedValue({
      companyId: "company-1",
      ruleType: "invoice_reminder"
    });
    vi.mocked(dependencies.loadInvoiceEmailContext).mockResolvedValue({
      companyId: "company-1",
      invoiceId: "invoice-1",
      customerId: "customer-1",
      status: "overdue",
      invoiceNumber: "INV-1001",
      total: "400.00",
      balanceDue: "275.00",
      dueAt: new Date("2026-04-01T00:00:00.000Z"),
      stripePaymentLinkUrl: "https://example.com/pay",
      reminder1SentAt: null,
      reminder2SentAt: null,
      reminder3SentAt: null,
      customer: {
        firstName: "Chris",
        lastName: "Pine",
        email: "customer@example.com"
      },
      company: {
        name: "Acme HVAC"
      }
    });

    await notificationsProcessor.handleSendInvoiceReminder(
      createJob("send-invoice-reminder", {
        companyId: "company-1",
        invoiceId: "invoice-1",
        customerId: "customer-1",
        reminderLevel: 2
      }),
      dependencies
    );

    expect(dependencies.email.sendInvoiceReminderEmail).toHaveBeenCalledWith("customer@example.com", {
      firstName: "Chris",
      invoiceNumber: "INV-1001",
      total: "400.00",
      balanceDue: "275.00",
      dueAt: "2026-04-01T00:00:00.000Z",
      paymentLinkUrl: "https://example.com/pay",
      companyName: "Acme HVAC",
      reminderLevel: 2
    });
    expect(dependencies.markInvoiceReminderSent).toHaveBeenCalledWith("company-1", "invoice-1", 2);
  });

  it("send-invoice-reminder skips when the invoice has already been paid", async () => {
    vi.mocked(dependencies.findAutomationRule).mockResolvedValue({
      companyId: "company-1",
      ruleType: "invoice_reminder"
    });
    vi.mocked(dependencies.loadInvoiceEmailContext).mockResolvedValue({
      companyId: "company-1",
      invoiceId: "invoice-1",
      customerId: "customer-1",
      status: "paid",
      invoiceNumber: "INV-1001",
      total: "400.00",
      balanceDue: "0.00",
      dueAt: new Date("2026-04-01T00:00:00.000Z"),
      stripePaymentLinkUrl: "https://example.com/pay",
      reminder1SentAt: null,
      reminder2SentAt: null,
      reminder3SentAt: null,
      customer: {
        firstName: "Chris",
        lastName: "Pine",
        email: "customer@example.com"
      },
      company: {
        name: "Acme HVAC"
      }
    });

    await notificationsProcessor.handleSendInvoiceReminder(
      createJob("send-invoice-reminder", {
        companyId: "company-1",
        invoiceId: "invoice-1",
        customerId: "customer-1",
        reminderLevel: 1
      }),
      dependencies
    );

    expect(dependencies.email.sendInvoiceReminderEmail).not.toHaveBeenCalled();
    expect(dependencies.markInvoiceReminderSent).not.toHaveBeenCalled();
  });

  it("send-service-agreement-email sends payment failure notices to the company owner", async () => {
    vi.mocked(dependencies.loadServiceAgreementEmailContext).mockResolvedValue({
      companyId: "company-1",
      maintenancePlanId: "plan-1",
      customerId: "customer-1",
      name: "Gold Plan",
      price: "49.00",
      nextServiceDate: "2026-05-01",
      customer: {
        firstName: "Chris",
        lastName: "Pine",
        email: "customer@example.com"
      },
      company: {
        name: "Acme HVAC"
      },
      template: {
        name: "Gold Plan"
      }
    });
    vi.mocked(dependencies.loadCompanyOwner).mockResolvedValue({
      id: "owner-1",
      firstName: "Ava",
      email: "owner@example.com"
    });

    await notificationsProcessor.handleSendServiceAgreementEmail(
      createJob("send-service-agreement-email", {
        companyId: "company-1",
        maintenancePlanId: "plan-1",
        emailType: "payment_failed",
        manageUrl: "https://example.com/manage"
      }),
      dependencies
    );

    expect(dependencies.email.sendServiceAgreementPaymentFailedEmail).toHaveBeenCalledWith("owner@example.com", {
      ownerFirstName: "Ava",
      customerName: "Chris Pine",
      planName: "Gold Plan",
      amount: "49.00",
      manageUrl: "https://example.com/manage",
      companyName: "Acme HVAC"
    });
  });

  it("send-service-agreement-email sends renewal reminders to the customer", async () => {
    vi.mocked(dependencies.loadServiceAgreementEmailContext).mockResolvedValue({
      companyId: "company-1",
      maintenancePlanId: "plan-1",
      customerId: "customer-1",
      name: "Gold Plan",
      price: "49.00",
      nextServiceDate: "2026-05-01",
      customer: {
        firstName: "Chris",
        lastName: "Pine",
        email: "customer@example.com"
      },
      company: {
        name: "Acme HVAC"
      },
      template: {
        name: "Gold Plan"
      }
    });
    vi.mocked(dependencies.findAutomationRule).mockResolvedValue({
      companyId: "company-1",
      ruleType: "service_agreement_renewal"
    });

    await notificationsProcessor.handleSendServiceAgreementEmail(
      createJob("send-service-agreement-email", {
        companyId: "company-1",
        maintenancePlanId: "plan-1",
        emailType: "renewal_reminder"
      }),
      dependencies
    );

    expect(dependencies.email.sendServiceAgreementRenewalReminderEmail).toHaveBeenCalledWith(
      "customer@example.com",
      {
        firstName: "Chris",
        planName: "Gold Plan",
        nextServiceDate: "2026-05-01",
        companyName: "Acme HVAC"
      }
    );
  });
});
