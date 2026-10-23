import type { OutboundEmailChannel, OutboundEmailPayload } from "./channels.js";

export type ResendEmailAdapterConfig = {
  apiKey: string;
  defaultFrom: string;
};

/**
 * Resend transactional email adapter (official MVP email provider).
 */
export function createResendEmailChannel(config: ResendEmailAdapterConfig): OutboundEmailChannel {
  return {
    async sendTransactionalEmail(payload: OutboundEmailPayload): Promise<{ providerMessageId: string }> {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: config.defaultFrom,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          reply_to: payload.replyTo,
          tags: payload.tags?.map((name) => ({ name, value: "true" }))
        })
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Resend send failed (${response.status}): ${detail}`);
      }

      const body = (await response.json()) as { id?: string };
      return { providerMessageId: body.id ?? "resend_unknown" };
    }
  };
}
