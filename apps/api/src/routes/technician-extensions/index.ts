import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import {
  listTechnicianTimeHandler,
  updateTechnicianServiceAreasHandler
} from "./handlers.js";
import {
  serviceAreaRouteSchema,
  serviceAreaValidation,
  technicianTimeRouteSchema,
  technicianTimeValidation
} from "./schemas.js";

const bookingAdminRoles = requireRole(["owner", "admin", "dispatcher"]);

const technicianExtensionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/:id/time", {
    preHandler: [fastify.authenticate],
    preValidation: [technicianTimeValidation],
    schema: technicianTimeRouteSchema
  }, listTechnicianTimeHandler);

  fastify.patch("/:id/service-areas", {
    preHandler: [fastify.authenticate, bookingAdminRoles],
    preValidation: [serviceAreaValidation],
    schema: serviceAreaRouteSchema
  }, updateTechnicianServiceAreasHandler);
};

export default technicianExtensionRoutes;
