import type { FastifyReply, FastifyRequest } from "fastify";

function buildTwimlResponse(): string {
  return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
}

export async function twilioHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  request.log.info(
    {
      hasFrom: typeof request.twilioParams?.From === "string",
      hasBody: typeof request.twilioParams?.Body === "string"
    },
    "Inbound Twilio SMS received"
  );

  return reply
    .code(200)
    .type("text/xml")
    .send(buildTwimlResponse());
}
