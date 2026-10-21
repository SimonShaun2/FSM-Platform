import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import {
  getTenantContextHandler,
  resolveEntityHandler,
  resolveInquiryAnchorHandler
} from "./handlers.js";
import {
  inquiryAnchorParamsValidation,
  resolveEntityValidation
} from "./schemas.js";

const tenantContextRoles = requireRole(["owner", "admin", "dispatcher"]);

const tenantContextRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/tenant-context", {
    preHandler: [fastify.authenticate, tenantContextRoles]
  }, getTenantContextHandler);

  fastify.post("/tenant-context/resolve", {
    preHandler: [fastify.authenticate, tenantContextRoles],
    preValidation: [resolveEntityValidation]
  }, resolveEntityHandler);

  fastify.get("/tenant-context/inquiries/:bookingRequestId", {
    preHandler: [fastify.authenticate, tenantContextRoles],
    preValidation: [inquiryAnchorParamsValidation]
  }, resolveInquiryAnchorHandler);
};

export default tenantContextRoutes;
