import pino from "pino";
import twilio from "twilio";

import { env } from "@fsm/config";

const logger = pino({
  name: "sms"
});

const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export async function sendSms(to: string, body: string): Promise<string> {
  const message = await twilioClient.messages.create({
    to,
    from: env.TWILIO_FROM_NUMBER,
    body
  });

  logger.debug({ messageSid: message.sid }, "Twilio SMS sent");

  return message.sid;
}
