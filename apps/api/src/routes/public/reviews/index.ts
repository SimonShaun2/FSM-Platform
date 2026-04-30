import type { FastifyPluginAsync } from "fastify";

import {
  completePublicReviewHandler,
  getPublicReviewHandler
} from "./handlers.js";
import {
  completeReviewRouteSchema,
  publicReviewRouteSchema,
  reviewCompleteValidation,
  reviewTokenValidation
} from "./schemas.js";

const publicReviewRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/:token", {
    preValidation: [reviewTokenValidation],
    schema: publicReviewRouteSchema
  }, getPublicReviewHandler);

  fastify.post("/:token/complete", {
    preValidation: [reviewCompleteValidation],
    schema: completeReviewRouteSchema
  }, completePublicReviewHandler);
};

export default publicReviewRoutes;
