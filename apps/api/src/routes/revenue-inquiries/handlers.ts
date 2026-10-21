import type { FastifyReply, FastifyRequest } from "fastify";

import { createInquiryResponseProposal } from "../../services/revenue-inquiry-response.service.js";
import type { CreateInquiryResponseBody } from "./schemas.js";

export async function createInquiryResponseHandler(request: FastifyRequest, reply: FastifyReply) {
  const { bookingRequestId } = request.params as { bookingRequestId: string };
  const body = request.body as CreateInquiryResponseBody;

  const result = await createInquiryResponseProposal(
    request.company.id,
    bookingRequestId,
    request.user.id,
    body.idempotencyKey
  );

  return reply.code(201).send({
    anchor: result.anchor,
    qualification: result.qualification,
    draft: result.draft,
    proposal: result.proposal
  });
}
