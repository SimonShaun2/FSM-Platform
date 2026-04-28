import { and, eq, isNull } from "drizzle-orm";
import type { Job, Processor } from "bullmq";
import pino from "pino";

import { env } from "@fsm/config";
import {
  automationRules,
  companies,
  customers,
  db,
  estimateItems,
  estimates,
  invoices,
  maintenancePlans,
  serviceAgreementTemplates,
  users
} from "@fsm/db";

const logger = pino({
  name: "notifications-processor"
});

type ReminderLevel = 1 | 2 | 3;
type InvoiceStatus = (typeof invoices.$inferSelect)["status"];
type AutomationRuleType = (typeof automationRules.$inferSelect)["ruleType"];
type AgreementEmailType = "renewal_reminder" | "payment_failed";

interface EmailModule {
  sendEstimateEmail(
    to: string,
    params: {
      firstName: string;
      estimateNumber: string;
      title: string | null;
      total: string;
      expiresAt: string | null;
      approvalUrl: string;
      companyName: string;
    }
  ): Promise<void>;
  sendInvoiceEmail(
    to: string,
    params: {
      firstName: string;
      invoiceNumber: string;
      total: string;
      dueAt: string | null;
      paymentLinkUrl: string;
      companyName: string;
    }
  ): Promise<void>;
  sendInvoiceReminderEmail(
    to: string,
    params: {
      firstName: string;
      invoiceNumber: string;
      total: string;
      balanceDue: string;
      dueAt: string | null;
      paymentLinkUrl: string;
      companyName: string;
      reminderLevel: ReminderLevel;
    }
  ): Promise<void>;
  sendInvoiceReminderOwnerAlertEmail(
    to: string,
    params: {
      ownerFirstName: string;
      customerName: string;
      invoiceNumber: string;
      balanceDue: string;
      paymentLinkUrl: string;
      companyName: string;
    }
  ): Promise<void>;
  sendServiceAgreementRenewalReminderEmail(
    to: string,
    params: {
      firstName: string;
      planName: string;
      nextServiceDate: string | null;
      companyName: string;
    }
  ): Promise<void>;
  sendServiceAgreementPaymentFailedEmail(
    to: string,
    params: {
      ownerFirstName: string;
      customerName: string;
      planName: string;
      amount: string;
      manageUrl: string;
      companyName: string;
    }
  ): Promise<void>;
}

interface EstimateEmailContext {
  companyId: string;
  estimateId: string;
  customerId: string;
  status: (typeof estimates.$inferSelect)["status"];
  estimateNumber: string;
  title: string | null;
  total: string;
  approvalToken: string | null;
  expiresAt: Date | null;
  customer: {
    firstName: string;
    email: string | null;
  };
  company: {
    name: string;
  };
  items: Array<{
    id: string;
  }>;
}

interface InvoiceEmailContext {
  companyId: string;
  invoiceId: string;
  customerId: string;
  status: InvoiceStatus;
  invoiceNumber: string;
  total: string;
  balanceDue: string;
  dueAt: Date | null;
  stripePaymentLinkUrl: string | null;
  reminder1SentAt: Date | null;
  reminder2SentAt: Date | null;
  reminder3SentAt: Date | null;
  customer: {
    firstName: string;
    lastName: string;
    email: string | null;
  };
  company: {
    name: string;
  };
}

interface ServiceAgreementEmailContext {
  companyId: string;
  maintenancePlanId: string;
  customerId: string;
  name: string;
  price: string | null;
  nextServiceDate: string | null;
  customer: {
    firstName: string;
    lastName: string;
    email: string | null;
  };
  company: {
    name: string;
  };
  template: {
    name: string;
  } | null;
}

interface CompanyOwnerContext {
  id: string;
  firstName: string;
  email: string | null;
}

interface AutomationRuleContext {
  companyId: string;
  ruleType: AutomationRuleType;
}

export interface NotificationsDependencies {
  email: EmailModule;
  loadEstimateEmailContext(companyId: string, estimateId: string): Promise<EstimateEmailContext | null>;
  loadInvoiceEmailContext(companyId: string, invoiceId: string): Promise<InvoiceEmailContext | null>;
  loadServiceAgreementEmailContext(
    companyId: string,
    maintenancePlanId: string
  ): Promise<ServiceAgreementEmailContext | null>;
  loadCompanyOwner(companyId: string): Promise<CompanyOwnerContext | null>;
  findAutomationRule(
    companyId: string,
    ruleType: AutomationRuleType
  ): Promise<AutomationRuleContext | null>;
  markInvoiceReminderSent(companyId: string, invoiceId: string, reminderLevel: ReminderLevel): Promise<void>;
}

function getJobString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getReminderLevel(data: Record<string, unknown>): ReminderLevel | null {
  const value = data.reminderLevel;
  return value === 1 || value === 2 || value === 3 ? value : null;
}

function getAgreementEmailType(data: Record<string, unknown>): AgreementEmailType | null {
  const value = data.emailType;
  return value === "renewal_reminder" || value === "payment_failed" ? value : null;
}

function isInvoiceUnpaid(status: InvoiceStatus): boolean {
  return status === "sent" || status === "partially_paid" || status === "overdue";
}

async function loadEmailModule(): Promise<EmailModule> {
  const moduleUrl = new URL("../../../api/dist/lib/email.js", import.meta.url);
  return import(moduleUrl.href) as Promise<EmailModule>;
}

const productionDependenciesPromise: Promise<NotificationsDependencies> = (async () => {
  const email = await loadEmailModule();

  return {
    email,
    async loadEstimateEmailContext(companyId, estimateId) {
      const [estimate] = await db
        .select()
        .from(estimates)
        .where(and(eq(estimates.companyId, companyId), eq(estimates.id, estimateId), isNull(estimates.deletedAt)))
        .limit(1);

      if (!estimate) {
        return null;
      }

      const [customer, company, items] = await Promise.all([
        db
          .select()
          .from(customers)
          .where(and(eq(customers.companyId, companyId), eq(customers.id, estimate.customerId), isNull(customers.deletedAt)))
          .limit(1),
        db
          .select()
          .from(companies)
          .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)))
          .limit(1),
        db
          .select({
            id: estimateItems.id
          })
          .from(estimateItems)
          .where(
            and(
              eq(estimateItems.companyId, companyId),
              eq(estimateItems.estimateId, estimate.id),
              isNull(estimateItems.deletedAt)
            )
          )
      ]);

      const customerRecord = customer[0];
      const companyRecord = company[0];

      if (!customerRecord || !companyRecord) {
        return null;
      }

      return {
        companyId,
        estimateId: estimate.id,
        customerId: estimate.customerId,
        status: estimate.status,
        estimateNumber: estimate.estimateNumber,
        title: estimate.title,
        total: estimate.total,
        approvalToken: estimate.approvalToken,
        expiresAt: estimate.expiresAt,
        customer: {
          firstName: customerRecord.firstName,
          email: customerRecord.email
        },
        company: {
          name: companyRecord.name
        },
        items
      };
    },
    async loadInvoiceEmailContext(companyId, invoiceId) {
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.companyId, companyId), eq(invoices.id, invoiceId), isNull(invoices.deletedAt)))
        .limit(1);

      if (!invoice) {
        return null;
      }

      const [customer, company] = await Promise.all([
        db
          .select()
          .from(customers)
          .where(and(eq(customers.companyId, companyId), eq(customers.id, invoice.customerId), isNull(customers.deletedAt)))
          .limit(1),
        db
          .select()
          .from(companies)
          .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)))
          .limit(1)
      ]);

      const customerRecord = customer[0];
      const companyRecord = company[0];

      if (!customerRecord || !companyRecord) {
        return null;
      }

      return {
        companyId,
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        status: invoice.status,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
        balanceDue: invoice.balanceDue,
        dueAt: invoice.dueAt,
        stripePaymentLinkUrl: invoice.stripePaymentLinkUrl,
        reminder1SentAt: invoice.reminder1SentAt,
        reminder2SentAt: invoice.reminder2SentAt,
        reminder3SentAt: invoice.reminder3SentAt,
        customer: {
          firstName: customerRecord.firstName,
          lastName: customerRecord.lastName,
          email: customerRecord.email
        },
        company: {
          name: companyRecord.name
        }
      };
    },
    async loadServiceAgreementEmailContext(companyId, maintenancePlanId) {
      const [plan] = await db
        .select()
        .from(maintenancePlans)
        .where(
          and(
            eq(maintenancePlans.companyId, companyId),
            eq(maintenancePlans.id, maintenancePlanId),
            isNull(maintenancePlans.deletedAt)
          )
        )
        .limit(1);

      if (!plan) {
        return null;
      }

      const [customer, company, template] = await Promise.all([
        db
          .select()
          .from(customers)
          .where(and(eq(customers.companyId, companyId), eq(customers.id, plan.customerId), isNull(customers.deletedAt)))
          .limit(1),
        db
          .select()
          .from(companies)
          .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)))
          .limit(1),
        plan.serviceAgreementTemplateId
          ? db
              .select()
              .from(serviceAgreementTemplates)
              .where(
                and(
                  eq(serviceAgreementTemplates.companyId, companyId),
                  eq(serviceAgreementTemplates.id, plan.serviceAgreementTemplateId),
                  isNull(serviceAgreementTemplates.deletedAt)
                )
              )
              .limit(1)
          : Promise.resolve([])
      ]);

      const customerRecord = customer[0];
      const companyRecord = company[0];
      const templateRecord = template[0] ?? null;

      if (!customerRecord || !companyRecord) {
        return null;
      }

      return {
        companyId,
        maintenancePlanId: plan.id,
        customerId: plan.customerId,
        name: plan.name,
        price: plan.price,
        nextServiceDate: plan.nextServiceDate,
        customer: {
          firstName: customerRecord.firstName,
          lastName: customerRecord.lastName,
          email: customerRecord.email
        },
        company: {
          name: companyRecord.name
        },
        template: templateRecord
          ? {
              name: templateRecord.name
            }
          : null
      };
    },
    async loadCompanyOwner(companyId) {
      const [owner] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          email: users.email
        })
        .from(users)
        .where(
          and(eq(users.companyId, companyId), eq(users.role, "owner"), isNull(users.deletedAt))
        )
        .limit(1);

      return owner ?? null;
    },
    async findAutomationRule(companyId, ruleType) {
      const [rule] = await db
        .select({
          companyId: automationRules.companyId,
          ruleType: automationRules.ruleType
        })
        .from(automationRules)
        .where(
          and(
            eq(automationRules.companyId, companyId),
            eq(automationRules.ruleType, ruleType),
            eq(automationRules.isEnabled, true),
            isNull(automationRules.deletedAt)
          )
        )
        .limit(1);

      return rule ?? null;
    },
    async markInvoiceReminderSent(companyId, invoiceId, reminderLevel) {
      const now = new Date();
      const reminderColumn =
        reminderLevel === 1
          ? { reminder1SentAt: now }
          : reminderLevel === 2
            ? { reminder2SentAt: now }
            : { reminder3SentAt: now };

      await db
        .update(invoices)
        .set({
          ...reminderColumn,
          updatedAt: now
        })
        .where(and(eq(invoices.companyId, companyId), eq(invoices.id, invoiceId), isNull(invoices.deletedAt)));
    }
  };
})();

async function getProductionDependencies(): Promise<NotificationsDependencies> {
  return productionDependenciesPromise;
}

export async function handleSendEstimateEmail(
  job: Job<Record<string, unknown>>,
  dependencies: NotificationsDependencies
): Promise<void> {
  const companyId = getJobString(job.data, "companyId");
  const estimateId = getJobString(job.data, "estimateId");
  const customerId = getJobString(job.data, "customerId");

  if (!companyId || !estimateId || !customerId) {
    logger.warn({ jobId: job.id ?? null }, "Estimate email job missing required identifiers");
    return;
  }

  const context = await dependencies.loadEstimateEmailContext(companyId, estimateId);

  if (!context || context.customerId !== customerId) {
    logger.warn({ companyId, estimateId, customerId }, "Estimate email job skipped because estimate context was not found");
    return;
  }

  if (context.status !== "sent") {
    logger.info({ companyId, estimateId, customerId }, "Estimate email job skipped because estimate is no longer sent");
    return;
  }

  if (!context.customer.email) {
    logger.warn({ companyId, estimateId, customerId }, "Estimate email job skipped because customer email is missing");
    return;
  }

  if (!context.approvalToken) {
    logger.warn({ companyId, estimateId, customerId }, "Estimate email job skipped because approval token is missing");
    return;
  }

  await dependencies.email.sendEstimateEmail(context.customer.email, {
    firstName: context.customer.firstName,
    estimateNumber: context.estimateNumber,
    title: context.title,
    total: context.total,
    expiresAt: context.expiresAt ? context.expiresAt.toISOString() : null,
    approvalUrl: `${env.APP_URL.replace(/\/$/, "")}/estimates/${context.approvalToken}`,
    companyName: context.company.name
  });

  logger.info({ companyId, estimateId, customerId }, "Estimate email sent");
}

export async function handleSendInvoiceEmail(
  job: Job<Record<string, unknown>>,
  dependencies: NotificationsDependencies
): Promise<void> {
  const companyId = getJobString(job.data, "companyId");
  const invoiceId = getJobString(job.data, "invoiceId");
  const customerId = getJobString(job.data, "customerId");

  if (!companyId || !invoiceId || !customerId) {
    logger.warn({ jobId: job.id ?? null }, "Invoice email job missing required identifiers");
    return;
  }

  const context = await dependencies.loadInvoiceEmailContext(companyId, invoiceId);

  if (!context || context.customerId !== customerId) {
    logger.warn({ companyId, invoiceId, customerId }, "Invoice email job skipped because invoice context was not found");
    return;
  }

  if (!isInvoiceUnpaid(context.status)) {
    logger.info({ companyId, invoiceId, customerId }, "Invoice email job skipped because invoice is no longer unpaid");
    return;
  }

  if (!context.stripePaymentLinkUrl) {
    logger.warn({ companyId, invoiceId, customerId }, "Invoice email job skipped because payment link is missing");
    return;
  }

  if (!context.customer.email) {
    logger.warn({ companyId, invoiceId, customerId }, "Invoice email job skipped because customer email is missing");
    return;
  }

  await dependencies.email.sendInvoiceEmail(context.customer.email, {
    firstName: context.customer.firstName,
    invoiceNumber: context.invoiceNumber,
    total: context.total,
    dueAt: context.dueAt ? context.dueAt.toISOString() : null,
    paymentLinkUrl: context.stripePaymentLinkUrl,
    companyName: context.company.name
  });

  logger.info({ companyId, invoiceId, customerId }, "Invoice email sent");
}

export async function handleSendInvoiceReminder(
  job: Job<Record<string, unknown>>,
  dependencies: NotificationsDependencies
): Promise<void> {
  const companyId = getJobString(job.data, "companyId");
  const invoiceId = getJobString(job.data, "invoiceId");
  const customerId = getJobString(job.data, "customerId");
  const reminderLevel = getReminderLevel(job.data);

  if (!companyId || !invoiceId || !customerId || !reminderLevel) {
    logger.warn({ jobId: job.id ?? null }, "Invoice reminder job missing required identifiers");
    return;
  }

  const rule = await dependencies.findAutomationRule(companyId, "invoice_reminder");

  if (!rule) {
    logger.info({ companyId, invoiceId, customerId, reminderLevel }, "Invoice reminder skipped because automation is disabled");
    return;
  }

  const context = await dependencies.loadInvoiceEmailContext(companyId, invoiceId);

  if (!context || context.customerId !== customerId) {
    logger.warn({ companyId, invoiceId, customerId, reminderLevel }, "Invoice reminder job skipped because invoice context was not found");
    return;
  }

  if (!isInvoiceUnpaid(context.status)) {
    logger.info({ companyId, invoiceId, customerId, reminderLevel }, "Invoice reminder job skipped because invoice is no longer unpaid");
    return;
  }

  if (!context.stripePaymentLinkUrl) {
    logger.warn({ companyId, invoiceId, customerId, reminderLevel }, "Invoice reminder job skipped because payment link is missing");
    return;
  }

  if (!context.customer.email) {
    logger.warn({ companyId, invoiceId, customerId, reminderLevel }, "Invoice reminder job skipped because customer email is missing");
    return;
  }

  const existingReminderTimestamp =
    reminderLevel === 1
      ? context.reminder1SentAt
      : reminderLevel === 2
        ? context.reminder2SentAt
        : context.reminder3SentAt;

  if (existingReminderTimestamp) {
    logger.info(
      { companyId, invoiceId, customerId, reminderLevel },
      "Invoice reminder job skipped because reminder already sent"
    );
    return;
  }

  await dependencies.email.sendInvoiceReminderEmail(context.customer.email, {
    firstName: context.customer.firstName,
    invoiceNumber: context.invoiceNumber,
    total: context.total,
    balanceDue: context.balanceDue,
    dueAt: context.dueAt ? context.dueAt.toISOString() : null,
    paymentLinkUrl: context.stripePaymentLinkUrl,
    companyName: context.company.name,
    reminderLevel
  });

  if (reminderLevel === 3) {
    const owner = await dependencies.loadCompanyOwner(companyId);

    if (!owner?.email) {
      logger.warn(
        { companyId, invoiceId, customerId, reminderLevel },
        "Invoice reminder owner alert skipped because owner email is missing"
      );
    } else {
      await dependencies.email.sendInvoiceReminderOwnerAlertEmail(owner.email, {
        ownerFirstName: owner.firstName,
        customerName: `${context.customer.firstName} ${context.customer.lastName}`.trim(),
        invoiceNumber: context.invoiceNumber,
        balanceDue: context.balanceDue,
        paymentLinkUrl: context.stripePaymentLinkUrl,
        companyName: context.company.name
      });
    }
  }

  await dependencies.markInvoiceReminderSent(companyId, invoiceId, reminderLevel);
  logger.info({ companyId, invoiceId, customerId, reminderLevel }, "Invoice reminder sent");
}

export async function handleSendServiceAgreementEmail(
  job: Job<Record<string, unknown>>,
  dependencies: NotificationsDependencies
): Promise<void> {
  const companyId = getJobString(job.data, "companyId");
  const maintenancePlanId = getJobString(job.data, "maintenancePlanId");
  const emailType = getAgreementEmailType(job.data);
  const manageUrl =
    getJobString(job.data, "manageUrl") ??
    `${env.APP_URL.replace(/\/$/, "")}/settings/service-agreements`;

  if (!companyId || !maintenancePlanId || !emailType) {
    logger.warn({ jobId: job.id ?? null }, "Service agreement email job missing required identifiers");
    return;
  }

  const context = await dependencies.loadServiceAgreementEmailContext(companyId, maintenancePlanId);

  if (!context) {
    logger.warn({ companyId, maintenancePlanId, emailType }, "Service agreement email job skipped because plan context was not found");
    return;
  }

  if (emailType === "renewal_reminder") {
    const rule = await dependencies.findAutomationRule(companyId, "service_agreement_renewal");

    if (!rule) {
      logger.info({ companyId, maintenancePlanId, emailType }, "Service agreement renewal reminder skipped because automation is disabled");
      return;
    }

    if (!context.customer.email) {
      logger.warn({ companyId, maintenancePlanId, emailType }, "Service agreement renewal reminder skipped because customer email is missing");
      return;
    }

    await dependencies.email.sendServiceAgreementRenewalReminderEmail(context.customer.email, {
      firstName: context.customer.firstName,
      planName: context.template?.name ?? context.name,
      nextServiceDate: context.nextServiceDate,
      companyName: context.company.name
    });

    logger.info({ companyId, maintenancePlanId, customerId: context.customerId }, "Service agreement renewal reminder sent");
    return;
  }

  const owner = await dependencies.loadCompanyOwner(companyId);

  if (!owner?.email) {
    logger.warn({ companyId, maintenancePlanId, emailType }, "Service agreement payment failure email skipped because owner email is missing");
    return;
  }

  await dependencies.email.sendServiceAgreementPaymentFailedEmail(owner.email, {
    ownerFirstName: owner.firstName,
    customerName: `${context.customer.firstName} ${context.customer.lastName}`.trim(),
    planName: context.template?.name ?? context.name,
    amount: context.price ?? "0.00",
    manageUrl,
    companyName: context.company.name
  });

  logger.info({ companyId, maintenancePlanId, ownerId: owner.id }, "Service agreement payment failure email sent");
}

export function createNotificationsProcessor(
  dependenciesProvider: NotificationsDependencies | (() => Promise<NotificationsDependencies>)
): Processor<Record<string, unknown>, void, string> {
  return async (job) => {
    const dependencies =
      typeof dependenciesProvider === "function"
        ? await dependenciesProvider()
        : dependenciesProvider;

    switch (job.name) {
      case "send-estimate-email":
        await handleSendEstimateEmail(job, dependencies);
        return;
      case "send-invoice-email":
        await handleSendInvoiceEmail(job, dependencies);
        return;
      case "send-invoice-reminder":
        await handleSendInvoiceReminder(job, dependencies);
        return;
      case "send-service-agreement-email":
      case "send-service-agreement-payment-failed-email":
        await handleSendServiceAgreementEmail(job, dependencies);
        return;
      default:
        logger.warn({ jobId: job.id ?? null, jobName: job.name }, "Unknown notifications job received");
    }
  };
}

export const processNotifications = createNotificationsProcessor(getProductionDependencies);
