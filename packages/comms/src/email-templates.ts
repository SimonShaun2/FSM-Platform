/** Channel-agnostic transactional email templates (render to subject + html). */

export const EMAIL_TEMPLATE_IDS = {
  passwordReset: "auth.password_reset",
  estimateSent: "estimate.sent",
  invoiceSent: "invoice.sent",
  invoiceReminder: "invoice.reminder",
  invoiceReminderOwnerAlert: "invoice.reminder_owner_alert",
  serviceAgreementRenewal: "service_agreement.renewal_reminder",
  serviceAgreementPaymentFailed: "service_agreement.payment_failed",
  campaignMessage: "campaign.message",
  bookingConfirmation: "booking.confirmation",
  bookingDecline: "booking.decline",
  savedCardMigrationReenterCard: "saved_card_migration.reenter_card"
} as const;

export type EmailTemplateId = (typeof EMAIL_TEMPLATE_IDS)[keyof typeof EMAIL_TEMPLATE_IDS];

export type RenderedTransactionalEmail = {
  templateId: EmailTemplateId;
  subject: string;
  html: string;
};

function emailShell(bodyHtml: string): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      ${bodyHtml}
    </div>
  `.trim();
}

function button(href: string, label: string): string {
  return `
    <p>
      <a href="${href}" style="display: inline-block; padding: 12px 18px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px;">
        ${label}
      </a>
    </p>
  `.trim();
}

function greetingName(firstName: string): string {
  return firstName.trim().length > 0 ? firstName.trim() : "there";
}

export function renderTransactionalEmail(
  templateId: EmailTemplateId,
  variables: Record<string, string>
): RenderedTransactionalEmail {
  switch (templateId) {
    case EMAIL_TEMPLATE_IDS.passwordReset: {
      const name = greetingName(variables.firstName ?? "");
      return {
        templateId,
        subject: "Reset your FSM password",
        html: emailShell(`
          <p>Hi ${name},</p>
          <p>We received a request to reset your password.</p>
          ${button(variables.resetUrl ?? "#", "Reset password")}
          <p>If you did not request this, you can safely ignore this email.</p>
        `)
      };
    }
    case EMAIL_TEMPLATE_IDS.estimateSent: {
      const name = greetingName(variables.firstName ?? "");
      const titleBlock = variables.title ? `<p><strong>Title:</strong> ${variables.title}</p>` : "";
      const expiresBlock = variables.expiresAtLabel
        ? `<p><strong>Expires:</strong> ${variables.expiresAtLabel}</p>`
        : "";
      return {
        templateId,
        subject: `Estimate ${variables.estimateNumber ?? ""} from ${variables.companyName ?? ""}`,
        html: emailShell(`
          <p>Hi ${name},</p>
          <p>${variables.companyName ?? ""} sent you estimate <strong>${variables.estimateNumber ?? ""}</strong>.</p>
          ${titleBlock}
          <p><strong>Total:</strong> $${variables.total ?? "0.00"}</p>
          ${expiresBlock}
          ${button(variables.approvalUrl ?? "#", "Review / Approve")}
        `)
      };
    }
    case EMAIL_TEMPLATE_IDS.invoiceSent: {
      const name = greetingName(variables.firstName ?? "");
      const dueBlock = variables.dueAtLabel ? `<p><strong>Due:</strong> ${variables.dueAtLabel}</p>` : "";
      return {
        templateId,
        subject: `Invoice ${variables.invoiceNumber ?? ""} from ${variables.companyName ?? ""}`,
        html: emailShell(`
          <p>Hi ${name},</p>
          <p>${variables.companyName ?? ""} sent you invoice <strong>${variables.invoiceNumber ?? ""}</strong>.</p>
          <p><strong>Total:</strong> $${variables.total ?? "0.00"}</p>
          ${dueBlock}
          ${button(variables.paymentLinkUrl ?? "#", "Pay invoice")}
          <p>If you've already paid, you can ignore this message.</p>
        `)
      };
    }
    case EMAIL_TEMPLATE_IDS.invoiceReminder: {
      const name = greetingName(variables.firstName ?? "");
      const level = variables.reminderLevel ?? "1";
      const reminderCopyByLevel: Record<string, string> = {
        "1": "Just a friendly reminder that your invoice is still open.",
        "2": "Your invoice is still unpaid and needs attention soon.",
        "3": "This is the final reminder before the balance is escalated internally."
      };
      const dueBlock = variables.dueAtLabel ? `<p><strong>Due:</strong> ${variables.dueAtLabel}</p>` : "";
      return {
        templateId,
        subject: `Reminder ${variables.invoiceNumber ?? ""} from ${variables.companyName ?? ""}`,
        html: emailShell(`
          <p>Hi ${name},</p>
          <p>${reminderCopyByLevel[level] ?? reminderCopyByLevel["1"]}</p>
          <p><strong>Invoice:</strong> ${variables.invoiceNumber ?? ""}</p>
          <p><strong>Total:</strong> $${variables.total ?? "0.00"}</p>
          <p><strong>Balance due:</strong> $${variables.balanceDue ?? "0.00"}</p>
          ${dueBlock}
          ${button(variables.paymentLinkUrl ?? "#", "Pay invoice")}
        `)
      };
    }
    case EMAIL_TEMPLATE_IDS.invoiceReminderOwnerAlert: {
      const name = greetingName(variables.ownerFirstName ?? "");
      return {
        templateId,
        subject: `Final invoice reminder sent for ${variables.invoiceNumber ?? ""}`,
        html: emailShell(`
          <p>Hi ${name},</p>
          <p>A final invoice reminder was sent to <strong>${variables.customerName ?? ""}</strong>.</p>
          <p><strong>Invoice:</strong> ${variables.invoiceNumber ?? ""}</p>
          <p><strong>Balance due:</strong> $${variables.balanceDue ?? "0.00"}</p>
          <p>${variables.companyName ?? ""} may need manual follow-up if payment is still not received.</p>
          ${button(variables.paymentLinkUrl ?? "#", "View payment link")}
        `)
      };
    }
    case EMAIL_TEMPLATE_IDS.serviceAgreementRenewal: {
      const name = greetingName(variables.firstName ?? "");
      const dateBlock = variables.nextServiceDateLabel
        ? `<p><strong>Next service date:</strong> ${variables.nextServiceDateLabel}</p>`
        : "";
      return {
        templateId,
        subject: `${variables.planName ?? "Your plan"} service is coming up`,
        html: emailShell(`
          <p>Hi ${name},</p>
          <p>Your <strong>${variables.planName ?? ""}</strong> service agreement is coming up soon.</p>
          ${dateBlock}
          <p>${variables.companyName ?? ""} will reach out if any scheduling updates are needed.</p>
        `)
      };
    }
    case EMAIL_TEMPLATE_IDS.serviceAgreementPaymentFailed: {
      const name = greetingName(variables.ownerFirstName ?? "");
      return {
        templateId,
        subject: "Service agreement payment failed",
        html: emailShell(`
          <p>Hi ${name},</p>
          <p>A service agreement renewal payment failed for <strong>${variables.customerName ?? ""}</strong>.</p>
          <p><strong>Plan:</strong> ${variables.planName ?? ""}</p>
          <p><strong>Amount:</strong> $${variables.amount ?? "0.00"}</p>
          <p>${variables.companyName ?? ""} should review the subscription and payment method details.</p>
          ${button(variables.manageUrl ?? "#", "Manage service agreements")}
        `)
      };
    }
    case EMAIL_TEMPLATE_IDS.campaignMessage: {
      const name = greetingName(variables.firstName ?? "");
      return {
        templateId,
        subject: variables.subject ?? "",
        html: emailShell(`
          <p>Hi ${name},</p>
          <p>${variables.body ?? ""}</p>
          <p>Reply to this email if you'd like to connect with ${variables.companyName ?? ""}.</p>
        `)
      };
    }
    case EMAIL_TEMPLATE_IDS.bookingConfirmation: {
      const name = greetingName(variables.firstName ?? "");
      const scheduledBlock = variables.scheduledLabel
        ? `<p><strong>When:</strong> ${variables.scheduledLabel}</p>`
        : "";
      return {
        templateId,
        subject: `Booking confirmed — ${variables.referenceNumber ?? ""}`,
        html: emailShell(`
          <p>Hi ${name},</p>
          <p>${variables.companyName ?? ""} confirmed your booking <strong>${variables.referenceNumber ?? ""}</strong>.</p>
          ${scheduledBlock}
          <p>If you need to make changes, contact ${variables.companyName ?? "us"}.</p>
        `)
      };
    }
    case EMAIL_TEMPLATE_IDS.bookingDecline: {
      const name = greetingName(variables.firstName ?? "");
      const reasonBlock = variables.reason
        ? `<p>${variables.reason}</p>`
        : "<p>Please contact our office to reschedule.</p>";
      return {
        templateId,
        subject: `Booking update — ${variables.referenceNumber ?? ""}`,
        html: emailShell(`
          <p>Hi ${name},</p>
          <p>${variables.companyName ?? ""} was unable to confirm booking <strong>${variables.referenceNumber ?? ""}</strong>.</p>
          ${reasonBlock}
        `)
      };
    }
    case EMAIL_TEMPLATE_IDS.savedCardMigrationReenterCard: {
      const name = greetingName(variables.firstName ?? "");
      return {
        templateId,
        subject: `Update your card on file — ${variables.companyName ?? "Renvani"}`,
        html: emailShell(`
          <p>Hi ${name},</p>
          <p>${variables.companyName ?? "Your service provider"} is moving billing to a new secure system powered by <strong>Renvani</strong>.</p>
          <p>We could not automatically move your saved card from your prior processor. Please add your card again the next time you receive an invoice — it only takes a moment.</p>
          ${button(variables.paymentPortalUrl ?? "#", "Add payment method")}
          <p>If you have questions, contact ${variables.companyName ?? "our office"}.</p>
        `)
      };
    }
    default:
      throw new Error(`UNKNOWN_EMAIL_TEMPLATE:${templateId}`);
  }
}

export function resolveOutboundEmailFromAddress(input: {
  resendEmailEnabled: boolean;
  resendFromEmail: string;
  sendgridFromEmail: string;
}): string {
  if (input.resendEmailEnabled && input.resendFromEmail.length > 0) {
    return input.resendFromEmail;
  }

  return input.sendgridFromEmail;
}
