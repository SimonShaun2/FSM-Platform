import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import {
  createDataExportHandler,
  downloadDataExportHandler,
  getDataExportHandler,
  getDataExportManifestHandler,
  listDataExportsHandler,
  retryDataExportHandler
} from "./handlers.js";
import {
  createDataExportValidation,
  dataExportSessionIdValidation,
  getManifestRouteSchema,
  listDataExportsValidation
} from "./schemas.js";

const dataExportRoutes: FastifyPluginAsync = async (fastify) => {
  const authenticate = fastify.authenticate;
  const requireOwnerOrAdmin = requireRole(["owner", "admin"]);

  fastify.get("/data-exports/manifest", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    schema: getManifestRouteSchema
  }, getDataExportManifestHandler);

  fastify.post("/data-exports", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: createDataExportValidation
  }, createDataExportHandler);

  fastify.get("/data-exports", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: listDataExportsValidation
  }, listDataExportsHandler);

  fastify.get("/data-exports/:id", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: dataExportSessionIdValidation
  }, getDataExportHandler);

  fastify.get("/data-exports/:id/download", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: dataExportSessionIdValidation
  }, downloadDataExportHandler);

  fastify.post("/data-exports/:id/retry", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: dataExportSessionIdValidation
  }, retryDataExportHandler);
};

export default dataExportRoutes;
