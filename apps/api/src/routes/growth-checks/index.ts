import type { FastifyPluginAsync } from "fastify";

import { requireRenaviInternalStaff } from "../../lib/require-renavi-internal.js";
import {
  createFindingHandler,
  createGrowthCheckHandler,
  createIdentityCandidateHandler,
  deleteFindingHandler,
  deleteGrowthCheckHandler,
  deleteIdentityCandidateHandler,
  getGrowthCheckHandler,
  listGrowthCheckAuditHandler,
  listGrowthCheckQueueHandler,
  updateFindingHandler,
  updateGrowthCheckHandler,
  updateIdentityCandidateHandler
} from "./handlers.js";
import {
  createFindingValidation,
  createGrowthCheckValidation,
  createIdentityCandidateValidation,
  findingParamsValidation,
  growthCheckIdParamsValidation,
  identityCandidateParamsValidation,
  listGrowthCheckQueueValidation,
  updateFindingValidation,
  updateGrowthCheckValidation,
  updateIdentityCandidateValidation
} from "./schemas.js";

const growthCheckRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/growth/checks", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalStaff],
    preValidation: [listGrowthCheckQueueValidation]
  }, listGrowthCheckQueueHandler);

  fastify.post("/growth/checks", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalStaff],
    preValidation: [createGrowthCheckValidation]
  }, createGrowthCheckHandler);

  fastify.get("/growth/checks/:id", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalStaff],
    preValidation: [growthCheckIdParamsValidation]
  }, getGrowthCheckHandler);

  fastify.patch("/growth/checks/:id", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalStaff],
    preValidation: [updateGrowthCheckValidation]
  }, updateGrowthCheckHandler);

  fastify.delete("/growth/checks/:id", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalStaff],
    preValidation: [growthCheckIdParamsValidation]
  }, deleteGrowthCheckHandler);

  fastify.get("/growth/checks/:id/audit-events", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalStaff],
    preValidation: [growthCheckIdParamsValidation]
  }, listGrowthCheckAuditHandler);

  fastify.post("/growth/checks/:id/identity-candidates", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalStaff],
    preValidation: [createIdentityCandidateValidation]
  }, createIdentityCandidateHandler);

  fastify.patch("/growth/checks/:id/identity-candidates/:candidateId", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalStaff],
    preValidation: [updateIdentityCandidateValidation]
  }, updateIdentityCandidateHandler);

  fastify.delete("/growth/checks/:id/identity-candidates/:candidateId", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalStaff],
    preValidation: [identityCandidateParamsValidation]
  }, deleteIdentityCandidateHandler);

  fastify.post("/growth/checks/:id/findings", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalStaff],
    preValidation: [createFindingValidation]
  }, createFindingHandler);

  fastify.patch("/growth/checks/:id/findings/:findingId", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalStaff],
    preValidation: [updateFindingValidation]
  }, updateFindingHandler);

  fastify.delete("/growth/checks/:id/findings/:findingId", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalStaff],
    preValidation: [findingParamsValidation]
  }, deleteFindingHandler);
};

export default growthCheckRoutes;
