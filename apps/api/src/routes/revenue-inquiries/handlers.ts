import type { FastifyReply, FastifyRequest } from "fastify";

import { createInquiryResponseProposal } from "../../services/revenue-inquiry-response.service.js";
import {
  getInquiryIntakeForBookingRequest,
  intakeInboxInquiry,
  intakeStaffInquiry
} from "../../services/revenue-inquiry-intake.service.js";
import type { CreateInquiryResponseBody } from "./schemas.js";
import type { InboxInquiryIntakeInput, StaffInquiryIntakeInput } from "@fsm/types";

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

export async function staffInquiryIntakeHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as StaffInquiryIntakeInput;
  const inquiry = await intakeStaffInquiry(request.company.id, request.user.id, body);
  return reply.code(201).send({ inquiry });
}

export async function inboxInquiryIntakeHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as InboxInquiryIntakeInput;
  const inquiry = await intakeInboxInquiry(request.company.id, request.user.id, body);
  return reply.code(201).send({ inquiry });
}

export async function getInquiryIntakeHandler(request: FastifyRequest, reply: FastifyReply) {
  const { bookingRequestId } = request.params as { bookingRequestId: string };
  const inquiry = await getInquiryIntakeForBookingRequest(request.company.id, bookingRequestId);
  return reply.send({ inquiry });
}
