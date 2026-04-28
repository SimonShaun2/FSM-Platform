import type { FastifyPluginAsync } from "fastify";

import {
  createPropertyHandler,
  deletePropertyHandler,
  getPropertyHandler,
  listPropertiesHandler,
  updatePropertyHandler
} from "./handlers.js";
import {
  createPropertySchema,
  deletePropertySchema,
  getPropertySchema,
  listPropertiesSchema,
  updatePropertySchema
} from "./schemas.js";

const propertyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", { preHandler: [fastify.authenticate], schema: listPropertiesSchema }, listPropertiesHandler);
  fastify.post("/", { preHandler: [fastify.authenticate], schema: createPropertySchema }, createPropertyHandler);
  fastify.get("/:id", { preHandler: [fastify.authenticate], schema: getPropertySchema }, getPropertyHandler);
  fastify.patch("/:id", { preHandler: [fastify.authenticate], schema: updatePropertySchema }, updatePropertyHandler);
  fastify.delete("/:id", { preHandler: [fastify.authenticate], schema: deletePropertySchema }, deletePropertyHandler);
};

export default propertyRoutes;
