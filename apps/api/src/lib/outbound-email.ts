import pino from "pino";
import sgMail from "@sendgrid/mail";

import {
  createResendEmailChannel,
  type EmailTemplateId,
  type OutboundEmailPayload,
  renderTransactionalEmail
} from "@fsm/comms";
import { env } from "@fsm/config";
import { featureFlags } from "@fsm/config/feature-flags";

const logger = pino({
  name: "outbound-email"
});

export function getTransactionalEmailFromAddress(): string {
  // FEATURE FLAG: resend-email-enabled
  if (featureFlags.resendEmailEnabled && env.RESEND_FROM_EMAIL.length > 0) {
    return env.RESEND_FROM_EMAIL;
  }

  return env.SENDGRID_FROM_EMAIL;
}

export async function deliverTransactionalEmail(
  payload: OutboundEmailPayload
): Promise<{ providerMessageId: string | null }> {
  // FEATURE FLAG: resend-email-enabled
  if (featureFlags.resendEmailEnabled) {
    if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
      throw new Error("RESEND_NOT_CONFIGURED");
    }

    const channel = createResendEmailChannel({
      apiKey: env.RESEND_API_KEY,
      defaultFrom: env.RESEND_FROM_EMAIL
    });
    const result = await channel.sendTransactionalEmail(payload);
    logger.debug({ providerMessageId: result.providerMessageId }, "Transactional email sent via Resend");
    return { providerMessageId: result.providerMessageId };
  }

  sgMail.setApiKey(env.SENDGRID_API_KEY);

  try {
    await sgMail.send({
      to: payload.to,
      from: env.SENDGRID_FROM_EMAIL,
      subject: payload.subject,
      html: payload.html
    });
    logger.debug({ recipient: "[redacted]" }, "Transactional email sent via SendGrid");
    return { providerMessageId: null };
  } catch (error) {
    logger.debug({ err: error, recipient: "[redacted]" }, "Transactional email failed");
    throw error;
  }
}

export async function sendRenderedTemplateEmail(
  to: string,
  templateId: EmailTemplateId,
  variables: Record<string, string>,
  tags?: string[]
): Promise<void> {
  const rendered = renderTransactionalEmail(templateId, variables);
  const payload: OutboundEmailPayload = {
    to,
    subject: rendered.subject,
    html: rendered.html
  };

  if (tags) {
    payload.tags = tags;
  }

  await deliverTransactionalEmail(payload);
}
