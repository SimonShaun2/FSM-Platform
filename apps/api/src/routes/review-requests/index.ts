import type { FastifyPluginAsync } from "fastify";

import {
  listReviewRequestsHandler,
  resendReviewRequestHandler,
  updateReviewRequestHandler
} from "./handlers.js";
import {
  listReviewRequestsRouteSchema,
  listReviewRequestsValidation,
  resendReviewRequestRouteSchema,
  resendReviewRequestValidation,
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

  fastify.post("/review-requests/:id/resend", {
    preHandler: [fastify.authenticate],
    preValidation: [resendReviewRequestValidation],
    schema: resendReviewRequestRouteSchema
  }, resendReviewRequestHandler);
};

export default reviewRequestRoutes;
