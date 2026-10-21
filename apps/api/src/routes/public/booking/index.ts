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

import {
  bookingRequestTimesByIp,
  getRateLimitWindowMs,
  slotHoldTimesByReference
} from "./rate-limit-state.js";

const RATE_LIMIT = 10;
const SLOT_HOLD_REF_RATE_LIMIT = 15;
const RATE_LIMIT_WINDOW_MS = getRateLimitWindowMs();

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

  const key = `${slug}:${ref}`;
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const requestTimes = slotHoldTimesByReference.get(key) ?? [];
  const activeTimes = requestTimes.filter((timestamp) => timestamp > cutoff);

  if (activeTimes.length >= SLOT_HOLD_REF_RATE_LIMIT) {
    await reply.status(429).send({
      error: "RATE_LIMITED",
      message: "Too many slot hold attempts for this booking reference. Please try again later.",
      requestId: request.id
    });
    return;
  }

  activeTimes.push(now);
  slotHoldTimesByReference.set(key, activeTimes);
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
    preValidation: [bookingSlotHoldReferenceRateLimit, publicHoldBookingSlotValidation],
    schema: publicSlotHoldRouteSchema
  }, holdPublicBookingSlotHandler);
};

export default publicBookingRoutes;
