import type { FastifyPluginAsync } from "fastify";

import { getCompanyHandler, updateCompanyHandler } from "./handlers.js";
import { getCompanyRouteSchema, updateCompanyRouteSchema, updateCompanyValidation } from "./schemas.js";

const companyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", { preHandler: [fastify.authenticate], schema: getCompanyRouteSchema }, getCompanyHandler);
  fastify.patch(
    "/",
    {
      preHandler: [fastify.authenticate],
      preValidation: [updateCompanyValidation],
      schema: updateCompanyRouteSchema
    },
    updateCompanyHandler
  );
};

export default companyRoutes;
