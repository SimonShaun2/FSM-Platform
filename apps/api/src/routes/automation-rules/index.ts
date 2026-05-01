import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import { listAutomationRulesHandler, updateAutomationRuleHandler } from "./handlers.js";
import {
  automationRuleIdValidation,
  automationRuleListRouteSchema,
  automationRuleRouteSchema,
  updateAutomationRuleValidation
} from "./schemas.js";

const automationRulesReadRoles = requireRole(["owner", "admin", "dispatcher", "office"]);
const automationRulesWriteRoles = requireRole(["owner", "admin"]);

const automationRuleRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/automation-rules", {
    preHandler: [fastify.authenticate, automationRulesReadRoles],
    schema: automationRuleListRouteSchema
  }, listAutomationRulesHandler);

  fastify.patch("/automation-rules/:id", {
    preHandler: [fastify.authenticate, automationRulesWriteRoles],
    preValidation: [automationRuleIdValidation, updateAutomationRuleValidation],
    schema: automationRuleRouteSchema
  }, updateAutomationRuleHandler);
};

export default automationRuleRoutes;
