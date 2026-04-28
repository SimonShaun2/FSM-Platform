import type { FastifyPluginAsync } from "fastify";

import {
  createAssetHandler,
  deleteAssetHandler,
  getAssetHandler,
  listAssetsHandler,
  updateAssetHandler
} from "./handlers.js";
import {
  createAssetSchema,
  deleteAssetSchema,
  getAssetSchema,
  listAssetsSchema,
  updateAssetSchema
} from "./schemas.js";

const assetRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", { preHandler: [fastify.authenticate], schema: listAssetsSchema }, listAssetsHandler);
  fastify.post("/", { preHandler: [fastify.authenticate], schema: createAssetSchema }, createAssetHandler);
  fastify.get("/:id", { preHandler: [fastify.authenticate], schema: getAssetSchema }, getAssetHandler);
  fastify.patch("/:id", { preHandler: [fastify.authenticate], schema: updateAssetSchema }, updateAssetHandler);
  fastify.delete("/:id", { preHandler: [fastify.authenticate], schema: deleteAssetSchema }, deleteAssetHandler);
};

export default assetRoutes;
