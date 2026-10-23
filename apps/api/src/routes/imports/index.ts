import fastifyMultipart from "@fastify/multipart";
import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import { rejectOversizedImportBodyByContentLength } from "./upload-guards.js";
import { csvImportMultipartLimits, csvImportMultipartParserOptions } from "./upload-limits.js";
import {
  confirmMappingHandler,
  createImportHandler,
  getImportErrorsHandler,
  getImportHandler,
  getImportIngestStatusHandler,
  listImportsHandler,
  rollbackImportHandler,
  startImportHandler
} from "./handlers.js";
import {
  confirmMappingRouteSchema,
  confirmMappingValidation,
  createImportRouteSchema,
  getImportRouteSchema,
  getImportIngestStatusRouteSchema,
  importErrorsRouteSchema,
  importSessionIdValidation,
  listImportsRouteSchema,
  listImportsValidation,
  rollbackImportRouteSchema,
  startImportValidation,
  startImportRouteSchema
} from "./schemas.js";

const importRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyMultipart, {
    limits: csvImportMultipartLimits,
    throwFileSizeLimit: csvImportMultipartParserOptions.throwFileSizeLimit
  });

  const authenticate = fastify.authenticate;
  const requireOwnerOrAdmin = requireRole(["owner", "admin"]);

  fastify.post("/imports", {
    preHandler: [rejectOversizedImportBodyByContentLength, authenticate, requireOwnerOrAdmin],
    schema: createImportRouteSchema
  }, createImportHandler);

  fastify.get("/imports", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: listImportsValidation,
    schema: listImportsRouteSchema
  }, listImportsHandler);

  fastify.get("/imports/:id", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: importSessionIdValidation,
    schema: getImportRouteSchema
  }, getImportHandler);

  fastify.get("/imports/:id/ingest-status", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: importSessionIdValidation,
    schema: getImportIngestStatusRouteSchema
  }, getImportIngestStatusHandler);

  fastify.post("/imports/:id/confirm-mapping", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: confirmMappingValidation,
    schema: confirmMappingRouteSchema
  }, confirmMappingHandler);

  fastify.post("/imports/:id/start", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: startImportValidation,
    schema: startImportRouteSchema
  }, startImportHandler);

  fastify.post("/imports/:id/rollback", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: importSessionIdValidation,
    schema: rollbackImportRouteSchema
  }, rollbackImportHandler);

  fastify.get("/imports/:id/errors", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: importSessionIdValidation,
    schema: importErrorsRouteSchema
  }, getImportErrorsHandler);
};

export default importRoutes;
