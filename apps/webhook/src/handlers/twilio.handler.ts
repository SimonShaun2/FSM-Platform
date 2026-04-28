import type { FastifyReply, FastifyRequest } from "fastify";
import { and, eq, isNull } from "drizzle-orm";

import { env } from "@fsm/config";
import {
  companies,
  customers,
  db,
  emitEventWithExecutor,
  messageLogs
} from "@fsm/db";

type TransactionExecutor = Pick<typeof db, "insert">;

function buildTwimlResponse(): string {
  return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
}

function getTwilioParam(params: Record<string, string> | undefined, key: string): string | null {
  const value = params?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function resolveCompanyContext(fromNumber: string, toNumber: string): Promise<{
  companyId: string;
  customerId: string | null;
} | null> {
  const [matchedCustomer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.phone, fromNumber), isNull(customers.deletedAt)))
    .limit(1);

  if (matchedCustomer) {
    return {
      companyId: matchedCustomer.companyId,
      customerId: matchedCustomer.id
    };
  }

  if (toNumber !== env.TWILIO_FROM_NUMBER) {
    return null;
  }

  const activeCompanies = await db
    .select()
    .from(companies)
    .where(isNull(companies.deletedAt))
    .limit(2);

  if (activeCompanies.length !== 1) {
    return null;
  }

  const [activeCompany] = activeCompanies;

  if (!activeCompany) {
    return null;
  }

  return {
    companyId: activeCompany.id,
    customerId: null
  };
}

export async function twilioHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const fromNumber = getTwilioParam(request.twilioParams, "From");
  const toNumber = getTwilioParam(request.twilioParams, "To");
  const messageBody = getTwilioParam(request.twilioParams, "Body");
  const providerMessageId = getTwilioParam(request.twilioParams, "MessageSid");

  if (!fromNumber || !toNumber || messageBody === null) {
    request.log.warn(
      {
        hasFrom: !!fromNumber,
        hasTo: !!toNumber,
        hasBody: messageBody !== null
      },
      "Inbound Twilio SMS missing expected fields"
    );

    return reply.code(200).type("text/xml").send(buildTwimlResponse());
  }

  const companyContext = await resolveCompanyContext(fromNumber, toNumber);

  if (!companyContext) {
    request.log.warn(
      {
        hasKnownCompany: false,
        hasProviderMessageId: !!providerMessageId
      },
      "Inbound Twilio SMS could not be associated with a company"
    );

    return reply.code(200).type("text/xml").send(buildTwimlResponse());
  }

  await db.transaction(async (tx: TransactionExecutor) => {
    const insertedMessages = await tx
      .insert(messageLogs)
      .values({
        companyId: companyContext.companyId,
        customerId: companyContext.customerId,
        channel: "sms",
        direction: "inbound",
        fromAddress: fromNumber,
        toAddress: toNumber,
        body: messageBody,
        providerMessageId
      })
      .returning();
    const messageLog = insertedMessages[0];

    if (!messageLog) {
      return;
    }

    await emitEventWithExecutor(tx, {
      companyId: companyContext.companyId,
      eventType: "message.received",
      actorType: "customer",
      entityType: "message_log",
      entityId: messageLog.id,
      ...(companyContext.customerId ? { customerId: companyContext.customerId } : {}),
      payload: {
        channel: "sms",
        direction: "inbound",
        providerMessageId
      },
      summary: "Inbound SMS received"
    });
  });

  request.log.info(
    {
      companyId: companyContext.companyId,
      hasCustomer: !!companyContext.customerId,
      hasProviderMessageId: !!providerMessageId
    },
    "Inbound Twilio SMS logged"
  );

  return reply
    .code(200)
    .type("text/xml")
    .send(buildTwimlResponse());
}
