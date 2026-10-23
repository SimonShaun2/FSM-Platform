import type { EmailTemplateId } from "@fsm/comms";
import { db, messageLogs } from "@fsm/db";

export type TransactionalEmailDeliveryRecord = {
  templateId: EmailTemplateId;
  subject: string;
  providerMessageId: string | null;
};

export async function recordTransactionalEmailMessageLog(input: {
  companyId: string;
  customerId: string | null;
  toAddress: string;
  fromAddress: string;
  delivery: TransactionalEmailDeliveryRecord;
  sourceSystem: "booking_notification" | "vip_membership_email";
  sourceId: string;
}): Promise<void> {
  const now = new Date();

  await db.insert(messageLogs).values({
    companyId: input.companyId,
    customerId: input.customerId,
    channel: "email",
    direction: "outbound",
    toAddress: input.toAddress,
    fromAddress: input.fromAddress,
    subject: input.delivery.subject,
    body: input.delivery.subject,
    providerMessageId: input.delivery.providerMessageId,
    providerStatus: "sent",
    sentAt: now,
    deliveredAt: now,
    sourceSystem: input.sourceSystem,
    sourceId: input.sourceId
  });
}
