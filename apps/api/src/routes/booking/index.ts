import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import {
  confirmBookingRequestHandler,
  declineBookingRequestHandler,
  getBookingHandoffHandler,
  initiateBookingHandoffHandler,
  reconcileBookingHandoffHandler,
  getBookingSlugAvailabilityHandler,
  getBookingDemandByZipHandler,
  getBookingRequestHandler,
  getBookingRequestStatsHandler,
  getBookingSettingsHandler,
  listBookingRequestsHandler,
  updateBookingSettingsHandler
} from "./handlers.js";
import {
  bookingAnalyticsValidation,
  bookingDemandByZipRouteSchema,
  bookingRequestIdValidation,
  bookingRequestListRouteSchema,
  bookingRequestListValidation,
  bookingRequestStatsRouteSchema,
  bookingRequestRouteSchema,
  bookingSlugAvailabilityRouteSchema,
  bookingSlugAvailabilityValidation,
  bookingSettingsRouteSchema,
  confirmBookingRequestValidation,
  declineBookingRequestValidation,
  bookingHandoffRouteSchema,
  initiateBookingHandoffValidation,
  reconcileBookingHandoffValidation,
  updateBookingSettingsValidation
} from "./schemas.js";

const bookingAdminRoles = requireRole(["owner", "admin", "dispatcher"]);

const bookingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/booking-requests", {
    preHandler: [fastify.authenticate, bookingAdminRoles],
    preValidation: [bookingRequestListValidation],
    schema: bookingRequestListRouteSchema
  }, listBookingRequestsHandler);

  fastify.get("/booking-requests/:id", {
    preHandler: [fastify.authenticate, bookingAdminRoles],
    preValidation: [bookingRequestIdValidation],
    schema: bookingRequestRouteSchema
  }, getBookingRequestHandler);

  fastify.post("/booking-requests/:id/confirm", {
    preHandler: [fastify.authenticate, bookingAdminRoles],
    preValidation: [confirmBookingRequestValidation],
    schema: bookingRequestRouteSchema
  }, confirmBookingRequestHandler);

  fastify.post("/booking-requests/:id/decline", {
    preHandler: [fastify.authenticate, bookingAdminRoles],
    preValidation: [declineBookingRequestValidation],
    schema: bookingRequestRouteSchema
  }, declineBookingRequestHandler);

  fastify.get("/booking-requests/:id/handoff", {
    preHandler: [fastify.authenticate, bookingAdminRoles],
    preValidation: [bookingRequestIdValidation],
    schema: bookingHandoffRouteSchema
  }, getBookingHandoffHandler);

  fastify.post("/booking-requests/:id/handoff", {
    preHandler: [fastify.authenticate, bookingAdminRoles],
    preValidation: [initiateBookingHandoffValidation],
    schema: bookingHandoffRouteSchema
  }, initiateBookingHandoffHandler);

  fastify.post("/booking-requests/:id/handoff/:handoffId/reconcile", {
    preHandler: [fastify.authenticate, bookingAdminRoles],
    preValidation: [reconcileBookingHandoffValidation],
    schema: bookingHandoffRouteSchema
  }, reconcileBookingHandoffHandler);

  fastify.get("/booking-settings", {
    preHandler: [fastify.authenticate, bookingAdminRoles],
    schema: bookingSettingsRouteSchema
  }, getBookingSettingsHandler);

  fastify.get("/booking-settings/check-slug", {
    preHandler: [fastify.authenticate, bookingAdminRoles],
    preValidation: [bookingSlugAvailabilityValidation],
    schema: bookingSlugAvailabilityRouteSchema
  }, getBookingSlugAvailabilityHandler);

  fastify.get("/booking-requests/stats", {
    preHandler: [fastify.authenticate, bookingAdminRoles],
    preValidation: [bookingAnalyticsValidation],
    schema: bookingRequestStatsRouteSchema
  }, getBookingRequestStatsHandler);

  fastify.get("/booking-requests/demand-by-zip", {
    preHandler: [fastify.authenticate, bookingAdminRoles],
    preValidation: [bookingAnalyticsValidation],
    schema: bookingDemandByZipRouteSchema
  }, getBookingDemandByZipHandler);

  fastify.patch("/booking-settings", {
    preHandler: [fastify.authenticate, bookingAdminRoles],
    preValidation: [updateBookingSettingsValidation],
    schema: bookingSettingsRouteSchema
  }, updateBookingSettingsHandler);
};

export default bookingRoutes;
