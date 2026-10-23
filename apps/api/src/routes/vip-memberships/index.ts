import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import {
  createTierHandler,
  deleteTierHandler,
  getPolicyHandler,
  listTiersHandler,
  updatePolicyHandler,
  updateTierHandler
} from "./handlers.js";
import {
  createTierValidation,
  deleteTierValidation,
  updatePolicyValidation,
  updateTierValidation
} from "./schemas.js";

const vipMembershipRoutes: FastifyPluginAsync = async (fastify) => {
  const authenticate = fastify.authenticate;
  const requireOwnerOrAdmin = requireRole(["owner", "admin"]);

  fastify.get("/vip/tiers", {
    preHandler: [authenticate, requireOwnerOrAdmin]
  }, listTiersHandler);

  fastify.post("/vip/tiers", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: createTierValidation
  }, createTierHandler);

  fastify.patch("/vip/tiers/:id", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: updateTierValidation
  }, updateTierHandler);

  fastify.delete("/vip/tiers/:id", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: deleteTierValidation
  }, deleteTierHandler);

  fastify.get("/vip/policy", {
    preHandler: [authenticate, requireOwnerOrAdmin]
  }, getPolicyHandler);

  fastify.patch("/vip/policy", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: updatePolicyValidation
  }, updatePolicyHandler);
};

export default vipMembershipRoutes;
