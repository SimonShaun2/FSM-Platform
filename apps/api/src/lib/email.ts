import pino from "pino";
import sgMail from "@sendgrid/mail";

import { env } from "@fsm/config";

const logger = pino({
  name: "email"
});

export interface EstimateEmailLineItem {
  name: string;
  description: string | null;
  quantity: string;
  total: string;
}

interface EstimateEmailParams {
  firstName: string;
  estimateNumber: string;
  title: string | null;
  total: string;
  expiresAt: string | null;
  approvalUrl: string;
  companyName: string;
}

interface InvoiceEmailParams {
  firstName: string;
  invoiceNumber: string;
  total: string;
  dueAt: string | null;
  paymentLinkUrl: string;
  companyName: string;
}

interface InvoiceReminderEmailParams extends InvoiceEmailParams {
  balanceDue: string;
  reminderLevel: 1 | 2 | 3;
}

interface InvoiceReminderOwnerAlertParams {
  ownerFirstName: string;
  customerName: string;
  invoiceNumber: string;
  balanceDue: string;
  paymentLinkUrl: string;
  companyName: string;
}

interface ServiceAgreementRenewalReminderEmailParams {
  firstName: string;
  planName: string;
  nextServiceDate: string | null;
  companyName: string;
}

interface CampaignEmailParams {
  firstName: string;
  subject: string;
  body: string;
  companyName: string;
}

function formatEmailDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-US");
}

export async function sendPasswordResetEmail(to: string, resetUrl: string, firstName: string): Promise<void> {
  sgMail.setApiKey(env.SENDGRID_API_KEY);

  const greetingName = firstName.trim().length > 0 ? firstName.trim() : "there";

  try {
    await sgMail.send({
      to,
      from: env.SENDGRID_FROM_EMAIL,
      subject: "Reset your FSM password",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <p>Hi ${greetingName},</p>
          <p>We received a request to reset your password.</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 18px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px;">
              Reset password
            </a>
          </p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `
    });

    logger.debug({ recipient: "[redacted]" }, "Password reset email sent");
  } catch (error) {
    logger.debug({ err: error, recipient: "[redacted]" }, "Password reset email failed");
    throw error;
  }
}

export async function sendEstimateEmail(to: string, params: EstimateEmailParams): Promise<void> {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
  const greetingName = params.firstName.trim().length > 0 ? params.firstName.trim() : "there";
  const formattedExpiryDate = formatEmailDate(params.expiresAt);

  try {
    await sgMail.send({
      to,
      from: env.SENDGRID_FROM_EMAIL,
      subject: `Estimate ${params.estimateNumber} from ${params.companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <p>Hi ${greetingName},</p>
          <p>${params.companyName} sent you estimate <strong>${params.estimateNumber}</strong>.</p>
          ${params.title ? `<p><strong>Title:</strong> ${params.title}</p>` : ""}
          <p><strong>Total:</strong> $${params.total}</p>
          ${formattedExpiryDate ? `<p><strong>Expires:</strong> ${formattedExpiryDate}</p>` : ""}
          <p>
            <a href="${params.approvalUrl}" style="display: inline-block; padding: 12px 18px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px;">
              Review / Approve
            </a>
          </p>
        </div>
      `
    });

    logger.debug({ recipient: "[redacted]" }, "Estimate email sent");
  } catch (error) {
    logger.debug({ err: error, recipient: "[redacted]" }, "Estimate email failed");
    throw error;
  }
}

export async function sendInvoiceEmail(to: string, params: InvoiceEmailParams): Promise<void> {
  sgMail.setApiKey(env.SENDGRID_API_KEY);

  const greetingName = params.firstName.trim().length > 0 ? params.firstName.trim() : "there";
  const formattedDueDate = formatEmailDate(params.dueAt);

  try {
    await sgMail.send({
      to,
      from: env.SENDGRID_FROM_EMAIL,
      subject: `Invoice ${params.invoiceNumber} from ${params.companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <p>Hi ${greetingName},</p>
          <p>${params.companyName} sent you invoice <strong>${params.invoiceNumber}</strong>.</p>
          <p><strong>Total:</strong> $${params.total}</p>
          ${formattedDueDate ? `<p><strong>Due:</strong> ${formattedDueDate}</p>` : ""}
          <p>
            <a href="${params.paymentLinkUrl}" style="display: inline-block; padding: 12px 18px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px;">
              Pay invoice
            </a>
          </p>
          <p>If you've already paid, you can ignore this message.</p>
        </div>
      `
    });

    logger.debug({ recipient: "[redacted]" }, "Invoice email sent");
  } catch (error) {
    logger.debug({ err: error, recipient: "[redacted]" }, "Invoice email failed");
    throw error;
  }
}

export async function sendInvoiceReminderEmail(
  to: string,
  params: InvoiceReminderEmailParams
): Promise<void> {
  sgMail.setApiKey(env.SENDGRID_API_KEY);

  const greetingName = params.firstName.trim().length > 0 ? params.firstName.trim() : "there";
  const formattedDueDate = formatEmailDate(params.dueAt);
  const reminderCopyByLevel: Record<InvoiceReminderEmailParams["reminderLevel"], string> = {
    1: "Just a friendly reminder that your invoice is still open.",
    2: "Your invoice is still unpaid and needs attention soon.",
    3: "This is the final reminder before the balance is escalated internally."
  };

  try {
    await sgMail.send({
      to,
      from: env.SENDGRID_FROM_EMAIL,
      subject: `Reminder ${params.invoiceNumber} from ${params.companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <p>Hi ${greetingName},</p>
          <p>${reminderCopyByLevel[params.reminderLevel]}</p>
          <p><strong>Invoice:</strong> ${params.invoiceNumber}</p>
          <p><strong>Total:</strong> $${params.total}</p>
          <p><strong>Balance due:</strong> $${params.balanceDue}</p>
          ${formattedDueDate ? `<p><strong>Due:</strong> ${formattedDueDate}</p>` : ""}
          <p>
            <a href="${params.paymentLinkUrl}" style="display: inline-block; padding: 12px 18px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px;">
              Pay invoice
            </a>
          </p>
        </div>
      `
    });

    logger.debug({ recipient: "[redacted]" }, "Invoice reminder email sent");
  } catch (error) {
    logger.debug({ err: error, recipient: "[redacted]" }, "Invoice reminder email failed");
    throw error;
  }
}

export async function sendInvoiceReminderOwnerAlertEmail(
  to: string,
  params: InvoiceReminderOwnerAlertParams
): Promise<void> {
  sgMail.setApiKey(env.SENDGRID_API_KEY);

  const greetingName = params.ownerFirstName.trim().length > 0 ? params.ownerFirstName.trim() : "there";

  try {
    await sgMail.send({
      to,
      from: env.SENDGRID_FROM_EMAIL,
      subject: `Final invoice reminder sent for ${params.invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <p>Hi ${greetingName},</p>
          <p>A final invoice reminder was sent to <strong>${params.customerName}</strong>.</p>
          <p><strong>Invoice:</strong> ${params.invoiceNumber}</p>
          <p><strong>Balance due:</strong> $${params.balanceDue}</p>
          <p>${params.companyName} may need manual follow-up if payment is still not received.</p>
          <p>
            <a href="${params.paymentLinkUrl}" style="display: inline-block; padding: 12px 18px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px;">
              View payment link
            </a>
          </p>
        </div>
      `
    });

    logger.debug({ recipient: "[redacted]" }, "Invoice reminder owner alert email sent");
  } catch (error) {
    logger.debug({ err: error, recipient: "[redacted]" }, "Invoice reminder owner alert email failed");
    throw error;
  }
}

export async function sendServiceAgreementRenewalReminderEmail(
  to: string,
  params: ServiceAgreementRenewalReminderEmailParams
): Promise<void> {
  sgMail.setApiKey(env.SENDGRID_API_KEY);

  const greetingName = params.firstName.trim().length > 0 ? params.firstName.trim() : "there";
  const formattedServiceDate = formatEmailDate(params.nextServiceDate);

  try {
    await sgMail.send({
      to,
      from: env.SENDGRID_FROM_EMAIL,
      subject: `${params.planName} service is coming up`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <p>Hi ${greetingName},</p>
          <p>Your <strong>${params.planName}</strong> service agreement is coming up soon.</p>
          ${formattedServiceDate ? `<p><strong>Next service date:</strong> ${formattedServiceDate}</p>` : ""}
          <p>${params.companyName} will reach out if any scheduling updates are needed.</p>
        </div>
      `
    });

    logger.debug({ recipient: "[redacted]" }, "Service agreement renewal reminder email sent");
  } catch (error) {
    logger.debug({ err: error, recipient: "[redacted]" }, "Service agreement renewal reminder email failed");
    throw error;
  }
}

export async function sendServiceAgreementPaymentFailedEmail(to: string, params: {
  ownerFirstName: string;
  customerName: string;
  planName: string;
  amount: string;
  manageUrl: string;
  companyName: string;
}): Promise<void> {
  sgMail.setApiKey(env.SENDGRID_API_KEY);

  const greetingName = params.ownerFirstName.trim().length > 0 ? params.ownerFirstName.trim() : "there";

  try {
    await sgMail.send({
      to,
      from: env.SENDGRID_FROM_EMAIL,
      subject: "Service agreement payment failed",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <p>Hi ${greetingName},</p>
          <p>A service agreement renewal payment failed for <strong>${params.customerName}</strong>.</p>
          <p><strong>Plan:</strong> ${params.planName}</p>
          <p><strong>Amount:</strong> $${params.amount}</p>
          <p>${params.companyName} should review the subscription and payment method details.</p>
          <p>
            <a href="${params.manageUrl}" style="display: inline-block; padding: 12px 18px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px;">
              Manage service agreements
            </a>
          </p>
        </div>
      `
    });

    logger.debug({ recipient: "[redacted]" }, "Service agreement payment failed email sent");
  } catch (error) {
    logger.debug({ err: error, recipient: "[redacted]" }, "Service agreement payment failed email failed");
    throw error;
  }
}

export async function sendCampaignEmail(to: string, params: CampaignEmailParams): Promise<void> {
  sgMail.setApiKey(env.SENDGRID_API_KEY);

  const greetingName = params.firstName.trim().length > 0 ? params.firstName.trim() : "there";

  try {
    await sgMail.send({
      to,
      from: env.SENDGRID_FROM_EMAIL,
      subject: params.subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <p>Hi ${greetingName},</p>
          <p>${params.body}</p>
          <p>Reply to this email if you'd like to connect with ${params.companyName}.</p>
        </div>
      `
    });

    logger.debug({ recipient: "[redacted]" }, "Campaign email sent");
  } catch (error) {
    logger.debug({ err: error, recipient: "[redacted]" }, "Campaign email failed");
    throw error;
  }
}
