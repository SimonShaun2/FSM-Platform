import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import {
  actionRecommendationHandler,
  dismissRecommendationHandler,
  getRecommendationHandler,
  getRevenueSummaryHandler,
  listRecommendationsHandler,
  snoozeRecommendationHandler
} from "./handlers.js";
import {
  actionRecommendationValidation,
  getRecommendationRouteSchema,
  listRecommendationsRouteSchema,
  listRecommendationsValidation,
  mutateRecommendationRouteSchema,
  recommendationIdValidation,
  revenueSummaryRouteSchema,
  snoozeRecommendationValidation,
  dismissRecommendationValidation
} from "./schemas.js";

const aiRoutes: FastifyPluginAsync = async (fastify) => {
  const authenticate = fastify.authenticate;
  const requireOwnerOrAdmin = requireRole(["owner", "admin"]);

  fastify.get("/revenue-summary", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    schema: revenueSummaryRouteSchema
  }, getRevenueSummaryHandler);

  fastify.get("/recommendations", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: listRecommendationsValidation,
    schema: listRecommendationsRouteSchema
  }, listRecommendationsHandler);

  fastify.get("/recommendations/:id", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: recommendationIdValidation,
    schema: getRecommendationRouteSchema
  }, getRecommendationHandler);

  fastify.post("/recommendations/:id/action", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: actionRecommendationValidation,
    schema: mutateRecommendationRouteSchema
  }, actionRecommendationHandler);

  fastify.post("/recommendations/:id/dismiss", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: dismissRecommendationValidation,
    schema: mutateRecommendationRouteSchema
  }, dismissRecommendationHandler);

  fastify.post("/recommendations/:id/snooze", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: snoozeRecommendationValidation,
    schema: mutateRecommendationRouteSchema
  }, snoozeRecommendationHandler);
};

export default aiRoutes;
