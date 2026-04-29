import type { FastifyPluginAsync } from "fastify";

import { getPublicPaymentLinkHandler } from "./handlers.js";
import { getPublicPaymentLinkSchema, publicPaymentValidation } from "./schemas.js";

const publicPayRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/:token", {
    preValidation: publicPaymentValidation,
    schema: getPublicPaymentLinkSchema
  }, getPublicPaymentLinkHandler);
};

export default publicPayRoutes;
