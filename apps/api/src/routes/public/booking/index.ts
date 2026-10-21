import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import {
  captureBookingInterestHandler,
  checkZipCoverageHandler,
  getBookingConfirmationHandler,
  getPublicAvailabilityHandler,
  getPublicBookingSettingsHandler,
  holdPublicBookingSlotHandler,
  submitBookingRequestHandler
} from "./handlers.js";
import {
  availabilityRouteSchema,
  availabilityValidation,
  bookingConfirmationRouteSchema,
  bookingConfirmationValidation,
  bookingSlugValidation,
  emailCaptureRouteSchema,
  emailCaptureValidation,
  publicBookingRouteSchema,
  publicHoldBookingSlotValidation,
  publicSlotHoldRouteSchema,
  submitBookingRouteSchema,
  submitBookingValidation,
  zipCheckRouteSchema,
  zipCheckValidation
} from "./schemas.js";

const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const bookingRequestTimesByIp = new Map<string, number[]>();

async function bookingRateLimit(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.method !== "POST") {
    return;
  }

  const ipAddress = request.ip;
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const requestTimes = bookingRequestTimesByIp.get(ipAddress) ?? [];
  const activeTimes = requestTimes.filter((timestamp) => timestamp > cutoff);

  if (activeTimes.length >= RATE_LIMIT) {
    await reply.status(429).send({
      error: "RATE_LIMITED",
      message: "Too many booking submissions. Please try again later.",
      requestId: request.id
    });
    return;
  }

  activeTimes.push(now);
  bookingRequestTimesByIp.set(ipAddress, activeTimes);
}

const publicBookingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/:slug", {
    preValidation: [bookingSlugValidation],
    schema: publicBookingRouteSchema
  }, getPublicBookingSettingsHandler);

  fastify.post("/:slug/check-zip", {
    preHandler: bookingRateLimit,
    preValidation: [zipCheckValidation],
    schema: zipCheckRouteSchema
  }, checkZipCoverageHandler);

  fastify.post("/:slug/email-capture", {
    preHandler: bookingRateLimit,
    preValidation: [emailCaptureValidation],
    schema: emailCaptureRouteSchema
  }, captureBookingInterestHandler);

  fastify.get("/:slug/availability", {
    preValidation: [availabilityValidation],
    schema: availabilityRouteSchema
  }, getPublicAvailabilityHandler);

  fastify.post("/:slug/submit", {
    preHandler: bookingRateLimit,
    preValidation: [submitBookingValidation],
    schema: submitBookingRouteSchema
  }, submitBookingRequestHandler);

  fastify.get("/:slug/confirmation/:ref", {
    preValidation: [bookingConfirmationValidation],
    schema: bookingConfirmationRouteSchema
  }, getBookingConfirmationHandler);

  fastify.post("/:slug/requests/:ref/slot-hold", {
    preHandler: bookingRateLimit,
    preValidation: [publicHoldBookingSlotValidation],
    schema: publicSlotHoldRouteSchema
  }, holdPublicBookingSlotHandler);
};

export default publicBookingRoutes;
