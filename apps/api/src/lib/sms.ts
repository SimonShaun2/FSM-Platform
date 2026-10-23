import pino from "pino";

import { sendSmsDisabled } from "@fsm/comms";
import { featureFlags } from "@fsm/config/feature-flags";

const logger = pino({
  name: "sms"
});

/**
 * Outbound SMS — disabled for MVP (no Twilio/Bird spend). Returns a stub provider id for message_logs.
 */
export async function sendSms(to: string, body: string): Promise<string> {
  // FEATURE FLAG: outbound-sms-enabled
  if (!featureFlags.outboundSmsEnabled) {
    const providerMessageId = await sendSmsDisabled({ to, body });
    logger.debug({ providerMessageId, toLength: to.length }, "SMS skipped (policy stub)");
    return providerMessageId;
  }

  throw new Error("OUTBOUND_SMS_DISABLED_BY_POLICY");
}
