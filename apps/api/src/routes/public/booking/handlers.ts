import type { FastifyReply, FastifyRequest } from "fastify";

import type { SubmitBookingRequestInput } from "@fsm/types";

import {
  captureBookingInterest,
  checkZipCoverage,
  getBookingAvailability,
  getBookingConfirmation,
  getPublicBookingSettingsBySlug,
  submitBookingRequest
} from "../../../services/booking.service.js";
import type {
  BookingConfirmationParams,
  BookingSlugParams,
  BookingSubmitQuery,
  PublicAvailabilityQuery,
  ZipCheckBody
} from "./schemas.js";

export async function getPublicBookingSettingsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as BookingSlugParams;
  const settings = await getPublicBookingSettingsBySlug(params.slug);

  return reply.send({
    booking: settings
  });
}

export async function checkZipCoverageHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as BookingSlugParams;
  const body = request.body as ZipCheckBody;
  const coverage = await checkZipCoverage(params.slug, body.zip);

  return reply.send(coverage);
}

export async function getPublicAvailabilityHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as BookingSlugParams;
  const query = request.query as PublicAvailabilityQuery;
  const availability = await getBookingAvailability(params.slug, query.zip, query.date);

  return reply.send({
    availability
  });
}

export async function submitBookingRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as BookingSlugParams;
  const query = request.query as BookingSubmitQuery;
  const result = await submitBookingRequest(params.slug, request.body as SubmitBookingRequestInput, query.src);

  return reply.status(201).send({
    bookingRequest: {
      id: result.bookingRequest.id,
      referenceNumber: result.bookingRequest.referenceNumber,
      status: result.bookingRequest.status
    },
    confirmation: result.confirmation
  });
}

export async function captureBookingInterestHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as BookingSlugParams;
  const body = request.body as { zip: string; email: string };
  const result = await captureBookingInterest(params.slug, body.zip, body.email);

  return reply.send(result);
}

export async function getBookingConfirmationHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as BookingConfirmationParams;
  const confirmation = await getBookingConfirmation(params.slug, params.ref);

  return reply.send({
    confirmation
  });
}
