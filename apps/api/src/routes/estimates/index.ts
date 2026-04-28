import type { FastifyPluginAsync } from "fastify";

import {
  createEstimateHandler,
  deleteEstimateHandler,
  getEstimateHandler,
  listEstimatesHandler,
  updateEstimateHandler
} from "./handlers.js";
import {
  createEstimateSchema,
  deleteEstimateSchema,
  getEstimateSchema,
  listEstimatesSchema,
  updateEstimateSchema
} from "./schemas.js";

const estimateRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", { preHandler: [fastify.authenticate], schema: listEstimatesSchema }, listEstimatesHandler);
  fastify.post("/", { preHandler: [fastify.authenticate], schema: createEstimateSchema }, createEstimateHandler);
  fastify.get("/:id", { preHandler: [fastify.authenticate], schema: getEstimateSchema }, getEstimateHandler);
  fastify.patch("/:id", { preHandler: [fastify.authenticate], schema: updateEstimateSchema }, updateEstimateHandler);
  fastify.delete("/:id", { preHandler: [fastify.authenticate], schema: deleteEstimateSchema }, deleteEstimateHandler);
};

export default estimateRoutes;
