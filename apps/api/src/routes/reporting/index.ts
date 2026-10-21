import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import { getJobSourceReportingHandler } from "./handlers.js";
import { jobSourceReportingRouteSchema, jobSourceReportingValidation } from "./schemas.js";

const ownerOrAdmin = requireRole(["owner", "admin"]);

const reportingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/reporting/job-sources", {
    preValidation: [jobSourceReportingValidation],
    preHandler: [fastify.authenticate, ownerOrAdmin],
    schema: jobSourceReportingRouteSchema
  }, getJobSourceReportingHandler);
};

export default reportingRoutes;
