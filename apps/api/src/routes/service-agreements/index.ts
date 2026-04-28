import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import {
  cancelAgreementHandler,
  createAgreementHandler,
  createTemplateHandler,
  deleteTemplateHandler,
  getAgreementHandler,
  listAgreementsHandler,
  listTemplatesHandler,
  listVisitsHandler,
  recordVisitHandler,
  updateAgreementHandler,
  updateTemplateHandler
} from "./handlers.js";
import {
  agreementIdValidation,
  cancelAgreementRouteSchema,
  cancelAgreementValidation,
  createAgreementRouteSchema,
  createAgreementValidation,
  createTemplateRouteSchema,
  createTemplateValidation,
  deleteTemplateRouteSchema,
  getAgreementRouteSchema,
  listAgreementsSchema,
  listAgreementsValidation,
  listTemplatesSchema,
  listVisitsRouteSchema,
  listVisitsValidation,
  recordVisitRouteSchema,
  recordVisitValidation,
  templateIdValidation,
  updateAgreementRouteSchema,
  updateAgreementValidation,
  updateTemplateRouteSchema,
  updateTemplateValidation
} from "./schemas.js";

const serviceAgreementRoutes: FastifyPluginAsync = async (fastify) => {
  const authenticate = fastify.authenticate;
  const requireOwnerOrAdmin = requireRole(["owner", "admin"]);

  fastify.get("/service-agreements/templates", {
    preHandler: authenticate,
    schema: listTemplatesSchema
  }, listTemplatesHandler);

  fastify.post("/service-agreements/templates", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: createTemplateValidation,
    schema: createTemplateRouteSchema
  }, createTemplateHandler);

  fastify.patch("/service-agreements/templates/:id", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: updateTemplateValidation,
    schema: updateTemplateRouteSchema
  }, updateTemplateHandler);

  fastify.delete("/service-agreements/templates/:id", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: templateIdValidation,
    schema: deleteTemplateRouteSchema
  }, deleteTemplateHandler);

  fastify.get("/service-agreements", {
    preHandler: authenticate,
    preValidation: listAgreementsValidation,
    schema: listAgreementsSchema
  }, listAgreementsHandler);

  fastify.post("/service-agreements", {
    preHandler: authenticate,
    preValidation: createAgreementValidation,
    schema: createAgreementRouteSchema
  }, createAgreementHandler);

  fastify.get("/service-agreements/:id", {
    preHandler: authenticate,
    preValidation: agreementIdValidation,
    schema: getAgreementRouteSchema
  }, getAgreementHandler);

  fastify.patch("/service-agreements/:id", {
    preHandler: authenticate,
    preValidation: updateAgreementValidation,
    schema: updateAgreementRouteSchema
  }, updateAgreementHandler);

  fastify.post("/service-agreements/:id/cancel", {
    preHandler: authenticate,
    preValidation: cancelAgreementValidation,
    schema: cancelAgreementRouteSchema
  }, cancelAgreementHandler);

  fastify.post("/service-agreements/:id/visits", {
    preHandler: authenticate,
    preValidation: recordVisitValidation,
    schema: recordVisitRouteSchema
  }, recordVisitHandler);

  fastify.get("/service-agreements/:id/visits", {
    preHandler: authenticate,
    preValidation: listVisitsValidation,
    schema: listVisitsRouteSchema
  }, listVisitsHandler);
};

export default serviceAgreementRoutes;
