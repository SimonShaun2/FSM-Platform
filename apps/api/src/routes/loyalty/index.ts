import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import { listLoyaltyReminderCandidatesHandler } from "./handlers.js";
import { listLoyaltyReminderCandidatesValidation } from "./schemas.js";

const loyaltyRoles = requireRole(["owner", "admin", "dispatcher"]);

const loyaltyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/loyalty/reminder-candidates", {
    preHandler: [fastify.authenticate, loyaltyRoles],
    preValidation: [listLoyaltyReminderCandidatesValidation]
  }, listLoyaltyReminderCandidatesHandler);
};

export default loyaltyRoutes;
