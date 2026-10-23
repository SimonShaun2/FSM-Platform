import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import {
  checkPublicBookingIpRateLimit,
  checkPublicSlotHoldReferenceRateLimit
} from "../../../lib/public-booking-rate-limit.js";
import {
  captureBookingInterestHandler,
  checkZipCoverageHandler,
  getBookingConfirmationHandler,
  getPublicAvailabilityHandler,
  getPublicBookingSettingsHandler,
  holdPublicBookingSlotHandler,
  inspectPublicBookingHoldTokenHandler,
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
  publicInspectHoldTokenRouteSchema,
  publicInspectHoldTokenValidation,
  publicSlotHoldRouteSchema,
  submitBookingRouteSchema,
  submitBookingValidation,
  zipCheckRouteSchema,
  zipCheckValidation
} from "./schemas.js";

async function bookingRateLimit(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.method !== "POST") {
    return;
  }

  const allowed = await checkPublicBookingIpRateLimit(request.ip);

  if (!allowed) {
    await reply.status(429).send({
      error: "RATE_LIMITED",
      message: "Too many booking submissions. Please try again later.",
      requestId: request.id
    });
    return;
  }
}

async function bookingSlotHoldReferenceRateLimit(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (request.method !== "POST") {
    return;
  }

  const params = request.params as { slug?: string; ref?: string };
  const slug = params.slug?.trim() ?? "";
  const ref = params.ref?.trim() ?? "";

  if (slug.length === 0 || ref.length === 0) {
    return;
  }

  const allowed = await checkPublicSlotHoldReferenceRateLimit(slug, ref);

  if (!allowed) {
    await reply.status(429).send({
      error: "RATE_LIMITED",
      message: "Too many slot hold attempts for this booking reference. Please try again later.",
      requestId: request.id
    });
    return;
  }
}

const publicBookingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/:slug", {
    preValidation: [bookingSlugValidation],
    schema: publicBookingRouteSchema
  }, getPublicBookingSettingsHandler);

  fastify.post("/:slug/check-zip", {
    preValidation: [bookingRateLimit, zipCheckValidation],
    schema: zipCheckRouteSchema
  }, checkZipCoverageHandler);

  fastify.post("/:slug/email-capture", {
    preValidation: [bookingRateLimit, emailCaptureValidation],
    schema: emailCaptureRouteSchema
  }, captureBookingInterestHandler);

  fastify.get("/:slug/availability", {
    preValidation: [availabilityValidation],
    schema: availabilityRouteSchema
  }, getPublicAvailabilityHandler);

  fastify.post("/:slug/submit", {
    preValidation: [bookingRateLimit, submitBookingValidation],
    schema: submitBookingRouteSchema
  }, submitBookingRequestHandler);

  fastify.get("/:slug/confirmation/:ref", {
    preValidation: [bookingConfirmationValidation],
    schema: bookingConfirmationRouteSchema
  }, getBookingConfirmationHandler);

  fastify.post("/:slug/requests/:ref/slot-hold", {
    preValidation: [bookingRateLimit, bookingSlotHoldReferenceRateLimit, publicHoldBookingSlotValidation],
    schema: publicSlotHoldRouteSchema
  }, holdPublicBookingSlotHandler);

  fastify.post("/:slug/hold-token/inspect", {
    preValidation: [bookingRateLimit, publicInspectHoldTokenValidation],
    schema: publicInspectHoldTokenRouteSchema
  }, inspectPublicBookingHoldTokenHandler);
};

export default publicBookingRoutes;
