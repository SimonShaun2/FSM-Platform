import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import {
  editOperatorInboxItemHandler,
  getJobProvenanceHandler,
  getOperatorInboxItemHandler,
  listOperatorInboxHandler
} from "./handlers.js";
import {
  editAgentActionValidation,
  jobProvenanceValidation,
  listOperatorInboxValidation,
  operatorInboxIdValidation
} from "./schemas.js";

const operatorRoles = requireRole(["owner", "admin", "dispatcher"]);

const operatorRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/operator/inbox", {
    preHandler: [fastify.authenticate, operatorRoles],
    preValidation: [listOperatorInboxValidation]
  }, listOperatorInboxHandler);

  fastify.get("/operator/inbox/:id", {
    preHandler: [fastify.authenticate, operatorRoles],
    preValidation: [operatorInboxIdValidation]
  }, getOperatorInboxItemHandler);

  fastify.patch("/operator/inbox/:id", {
    preHandler: [fastify.authenticate, operatorRoles],
    preValidation: [editAgentActionValidation]
  }, editOperatorInboxItemHandler);

  fastify.get("/operator/jobs/:jobId/provenance", {
    preHandler: [fastify.authenticate, operatorRoles],
    preValidation: [jobProvenanceValidation]
  }, getJobProvenanceHandler);
};

export default operatorRoutes;
