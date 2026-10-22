import type { FastifyReply, FastifyRequest } from "fastify";

import type { ConfirmSchedulingOptionInput, ListSchedulingOptionsQuery, SelectSchedulingOptionInput } from "@fsm/types";

import {
  confirmSchedulingOptionForBookingRequest,
  listSchedulingOptionsForBookingRequest,
  selectSchedulingOptionForBookingRequest
} from "../../services/scheduling-agent.service.js";
import type { SchedulingBookingRequestIdParams } from "./schemas.js";

export async function listSchedulingOptionsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as SchedulingBookingRequestIdParams;
  const result = await listSchedulingOptionsForBookingRequest(
    request.company.id,
    params.bookingRequestId,
    request.query as ListSchedulingOptionsQuery
  );

  return reply.send(result);
}

export async function selectSchedulingOptionHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as SchedulingBookingRequestIdParams;
  const result = await selectSchedulingOptionForBookingRequest(
    request.company.id,
    request.user.id,
    params.bookingRequestId,
    request.body as SelectSchedulingOptionInput
  );

  return reply.send({
    bookingRequest: {
      ...result.bookingRequest,
      confirmedAt: result.bookingRequest.confirmedAt?.toISOString() ?? null,
      confirmationSentAt: result.bookingRequest.confirmationSentAt?.toISOString() ?? null,
      cancelledAt: result.bookingRequest.cancelledAt?.toISOString() ?? null,
      createdAt: result.bookingRequest.createdAt.toISOString(),
      updatedAt: result.bookingRequest.updatedAt.toISOString(),
      deletedAt: result.bookingRequest.deletedAt?.toISOString() ?? null
    },
    hold: result.hold
  });
}

export async function confirmSchedulingOptionHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as SchedulingBookingRequestIdParams;
  const bookingRequest = await confirmSchedulingOptionForBookingRequest(
    request.company.id,
    request.user.id,
    params.bookingRequestId,
    request.body as ConfirmSchedulingOptionInput
  );

  return reply.send({
    bookingRequest: {
      ...bookingRequest,
      confirmedAt: bookingRequest.confirmedAt?.toISOString() ?? null,
      confirmationSentAt: bookingRequest.confirmationSentAt?.toISOString() ?? null,
      cancelledAt: bookingRequest.cancelledAt?.toISOString() ?? null,
      createdAt: bookingRequest.createdAt.toISOString(),
      updatedAt: bookingRequest.updatedAt.toISOString(),
      deletedAt: bookingRequest.deletedAt?.toISOString() ?? null
    }
  });
}
