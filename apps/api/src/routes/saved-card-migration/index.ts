import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import {
  applySavedCardMigrationMappingsHandler,
  confirmStripeImportHandler,
  getSavedCardMigrationHandler,
  sendSavedCardFallbackEmailHandler,
  startSavedCardMigrationHandler
} from "./handlers.js";
import {
  applyMappingsRouteSchema,
  applyMappingsValidation,
  confirmStripeImportRouteSchema,
  confirmStripeImportValidation,
  getSavedCardMigrationRouteSchema,
  getSavedCardMigrationValidation,
  sendFallbackEmailRouteSchema,
  sendFallbackEmailValidation,
  startSavedCardMigrationRouteSchema,
  startSavedCardMigrationValidation
} from "./schemas.js";

const savedCardMigrationRoutes: FastifyPluginAsync = async (fastify) => {
  const authenticate = fastify.authenticate;
  const requireOwnerOrAdmin = requireRole(["owner", "admin"]);

  fastify.post("/migrate/onboarding/sessions/:bundleId/saved-card-migration", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: startSavedCardMigrationValidation,
    schema: startSavedCardMigrationRouteSchema
  }, startSavedCardMigrationHandler);

  fastify.get("/migrate/onboarding/sessions/:bundleId/saved-card-migration", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: getSavedCardMigrationValidation,
    schema: getSavedCardMigrationRouteSchema
  }, getSavedCardMigrationHandler);

  fastify.post("/migrate/onboarding/sessions/:bundleId/saved-card-migration/confirm-stripe-import", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: confirmStripeImportValidation,
    schema: confirmStripeImportRouteSchema
  }, confirmStripeImportHandler);

  fastify.post("/migrate/onboarding/sessions/:bundleId/saved-card-migration/apply-mappings", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: applyMappingsValidation,
    schema: applyMappingsRouteSchema
  }, applySavedCardMigrationMappingsHandler);

  fastify.post("/migrate/onboarding/sessions/:bundleId/saved-card-migration/send-fallback-email", {
    preHandler: [authenticate, requireOwnerOrAdmin],
    preValidation: sendFallbackEmailValidation,
    schema: sendFallbackEmailRouteSchema
  }, sendSavedCardFallbackEmailHandler);
};

export default savedCardMigrationRoutes;
