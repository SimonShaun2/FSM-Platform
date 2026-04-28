import pino from "pino";
import sgMail from "@sendgrid/mail";

import { env } from "@fsm/config";

const logger = pino({
  name: "email"
});

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
