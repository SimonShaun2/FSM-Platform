import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import {
  createTechnicianHandler,
  deleteTechnicianHandler,
  getTechnicianAvailabilityHandler,
  getTechnicianHandler,
  getTechnicianPerformanceHandler,
  linkUserToTechnicianHandler,
  listTechniciansHandler,
  updateTechnicianHandler
} from "./handlers.js";
import {
  availabilityValidation,
  createTechnicianSchema,
  createTechnicianValidation,
  deleteTechnicianSchema,
  getTechnicianAvailabilitySchema,
  getTechnicianPerformanceSchema,
  getTechnicianSchema,
  linkUserToTechnicianSchema,
  linkUserValidation,
  listTechniciansSchema,
  listTechniciansValidation,
  technicianIdValidation,
  updateTechnicianSchema,
  updateTechnicianValidation
} from "./schemas.js";

const adminRoles = requireRole(["owner", "admin"]);

const technicianRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/",
    { preValidation: [listTechniciansValidation], preHandler: [fastify.authenticate], schema: listTechniciansSchema },
    listTechniciansHandler
  );
  fastify.post(
    "/",
    {
      preValidation: [createTechnicianValidation],
      preHandler: [fastify.authenticate, adminRoles],
      schema: createTechnicianSchema
    },
    createTechnicianHandler
  );
  fastify.get(
    "/:id/availability",
    {
      preValidation: [availabilityValidation],
      preHandler: [fastify.authenticate],
      schema: getTechnicianAvailabilitySchema
    },
    getTechnicianAvailabilityHandler
  );
  fastify.get(
    "/:id/performance",
    {
      preValidation: [technicianIdValidation],
      preHandler: [fastify.authenticate, adminRoles],
      schema: getTechnicianPerformanceSchema
    },
    getTechnicianPerformanceHandler
  );
  fastify.post(
    "/:id/link-user",
    {
      preValidation: [linkUserValidation],
      preHandler: [fastify.authenticate, adminRoles],
      schema: linkUserToTechnicianSchema
    },
    linkUserToTechnicianHandler
  );
  fastify.get(
    "/:id",
    { preValidation: [technicianIdValidation], preHandler: [fastify.authenticate], schema: getTechnicianSchema },
    getTechnicianHandler
  );
  fastify.patch(
    "/:id",
    {
      preValidation: [updateTechnicianValidation],
      preHandler: [fastify.authenticate, adminRoles],
      schema: updateTechnicianSchema
    },
    updateTechnicianHandler
  );
  fastify.delete(
    "/:id",
    {
      preValidation: [technicianIdValidation],
      preHandler: [fastify.authenticate, adminRoles],
      schema: deleteTechnicianSchema
    },
    deleteTechnicianHandler
  );
};

export default technicianRoutes;
