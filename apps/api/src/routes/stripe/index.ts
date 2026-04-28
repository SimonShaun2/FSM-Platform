import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import {
  createDashboardLinkHandler,
  createOnboardingLinkHandler,
  getConnectStatusHandler,
  handleOnboardingReturnHandler
} from "./handlers.js";
import {
  stripeConnectOnboardSchema,
  stripeConnectReturnSchema,
  stripeConnectStatusRouteSchema,
  stripeDashboardLinkSchema
} from "./schemas.js";

const stripeRoutes: FastifyPluginAsync = async (fastify) => {
  const authenticate = fastify.authenticate;

  fastify.post("/connect/onboard", {
    preHandler: [authenticate, requireRole(["owner"])],
    schema: stripeConnectOnboardSchema
  }, createOnboardingLinkHandler);

  fastify.get("/connect/return", {
    preHandler: [authenticate, requireRole(["owner"])],
    schema: stripeConnectReturnSchema
  }, handleOnboardingReturnHandler);

  fastify.get("/connect/status", {
    preHandler: [authenticate, requireRole(["owner", "admin"])],
    schema: stripeConnectStatusRouteSchema
  }, getConnectStatusHandler);

  fastify.post("/connect/dashboard-link", {
    preHandler: [authenticate, requireRole(["owner"])],
    schema: stripeDashboardLinkSchema
  }, createDashboardLinkHandler);
};

export default stripeRoutes;
