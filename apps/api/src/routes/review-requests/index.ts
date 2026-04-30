import type { FastifyPluginAsync } from "fastify";

import {
  listReviewRequestsHandler,
  updateReviewRequestHandler
} from "./handlers.js";
import {
  listReviewRequestsRouteSchema,
  listReviewRequestsValidation,
  updateReviewRequestRouteSchema,
  updateReviewRequestValidation
} from "./schemas.js";

const reviewRequestRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/review-requests", {
    preHandler: [fastify.authenticate],
    preValidation: [listReviewRequestsValidation],
    schema: listReviewRequestsRouteSchema
  }, listReviewRequestsHandler);

  fastify.patch("/review-requests/:id", {
    preHandler: [fastify.authenticate],
    preValidation: [updateReviewRequestValidation],
    schema: updateReviewRequestRouteSchema
  }, updateReviewRequestHandler);
};

export default reviewRequestRoutes;
